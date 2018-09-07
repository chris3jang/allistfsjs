var ObjectID = require('mongodb').ObjectID;
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const express = require('express')
const router = express.Router()

const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const authenticate = expressJwt({secret: 'theycutthefleeb'})

const bcrypt = require('bcrypt')
const crypto = require('crypto');


module.exports = function(app, db) {

  const listsCol = db.collection('lists')
  const itemsCol = db.collection('items')
  const usersCol = db.collection('localusers')
  

  //*******************************************AUTH*************************************************

  const isLoggedIn = (req, res, next) => {
    console.log("middleware isLoggedIn")
    console.log("req.query", req.query)
    console.log("req.headers ", req.headers)
    console.log("req.isAuthenticated: ", req.isAuthenticated())
    console.log("req.user: ", req.user)
    if(req.isAuthenticated()) {
      return next()
    }
    console.log("isAuthenticated: false")
    res.redirect('/')
  }

  app.get('/users/', authenticate, isLoggedIn, (req, res) => {
    console.log("users get: ", req.user)
    res.send()
  })



  const dbSerialize = {
    user: {
      updateOrCreate: (user, cb) => {
        console.log("dbSerialize updateOrCreate")
        console.log("user", user)
        cb(null, user)
      },
      authenticate: (un, pw, cb) => {
        console.log("dbSerialize authenticate")
        usersCol.findOne({username: un})
        .then(result => {
          if(null == result) {} //user not found
          else { //user found
            hash = result.password
            console.log("result.password", result.password, result)
            console.log("FOUND USER:  " + result.username)
            if(bcrypt.compareSync(pw, hash)) {
              //database.close()
              console.log("make sure this is the user object, then delete this console.log: ", result)
              cb(null, result)
              return
            }
            else {
              console.log("AUTH FAILED")
              //database.close()
              cb(null, false)
            }
          }
        })
      },
      register: (un, pw, cb) => {
        console.log("dbSerialize register")
        usersCol.findOne({username: un})
        .then(result => {
          if(null != result) {
            return console.log("USERNAME ALREADY EXISTS: ", result.username)
            //database.close()
            cb(null, false)
          }
          else {
            const hash = bcrypt.hashSync(pw, 8)
            console.log("hash", hash)
            const newUser = {
              username: un,
              password: hash,
              selectedListIndex: 0
            }
            console.log("CREATING USER: ", un)
            listsCol.insert({listTitle: "New List", orderNumber: 0, selected: true, selectedItemIndex: 0, user: un})
            .then(listInserted => {
              console.log("LISTINSERTED", listInserted)
              return listsCol.findOne({user: un})
            })
            .then(newList => {
              console.log("newList", newList)
              return itemsCol.insert({itemTitle: '', orderNumber: 0, parent: null, indentLevel: 0, list: newList._id.toString()}) 
            })
            .then(itemInserted => {
              console.log("itemInserted", itemInserted)
              return usersCol.insert(newUser)
            })
            .then(inserted => {
              //database.close()
              console.log("make sure this is the user object, then delete this console.log: ", inserted.ops[0])
              cb(null, inserted.ops[0])
            })
          }
        })
      }
    },

    client: {
      updateOrCreate: (data, cb) => {
        console.log("client updateOrCreate")
        console.log("data: ", data)
        db.collection('localclients').insert({user: data.user})
        .then(inserted => {
          console.log("inserted.ops[0]", inserted.ops[0])
          cb(null, {id: inserted.ops[0]._id})
        })
      },
      storeToken: (data, cb) => {
        console.log("storeToken")
        console.log("data arg", data)
        db.collection('localclients').findOneAndUpdate({_id: data.id}, {$set: {refreshToken: data.refreshToken}})
        .then(client => {
          cb()
        })
      },
      findUserOfToken: (data, cb) => {
        if(!data.refreshToken) return cb(new Error('invalid token'))
        db.collection('localclients').findOne({refreshToken: data.refreshToken})
        .then(client => {
          console.log("client.user", client.user)
          console.log("client._id", client._id)
          return cb(null, {
            id: client.user,
            clientId: client._id
          })
        })
      }
    }

  }

  passport.use('localtokenauth', new LocalStrategy(
    (username, password, done)=> {
      dbSerialize.user.authenticate(username, password, done)
  }))

  passport.use('localtokenreg', new LocalStrategy(
    (username, password, done)=> {
      dbSerialize.user.register(username, password, done)
  }))


  const serialize = (req, res, next) => {
    console.log("serialize")
    console.log("req.user", req.user)
    dbSerialize.user.updateOrCreate(req.user, (err, user) => {
      if(err) return next(err)
      console.log("req.user preupdateCreate", req.user)
      console.log("user", user)
      /*
      req.user = {
        id: user._id
      }
      */
      req.user = user._id
      console.log("req.user postupdateCreate", req.user)
      next()
  })}

  serializeClient = (req, res, next) => {  
    console.log("serializeClient")
    console.log("req.query", req.query)
    //if (req.query.permanent === ‘true’)
    dbSerialize.client.updateOrCreate({
      user: req.user
    }, (err, client) => {
      if (err) {
        return next(err);
      }
      // we store information needed in req.user
      console.log("req.user", req.user)
      console.log("client arg", client)
      req.user.clientId = client.id;
      console.log("req.user.clientId", req.user.clientId)
      console.log("req.user", req.user)
      next()
    });
  }

  const generateAccessToken = (req, res, next) => {
    console.log("generateAccessToken")
    console.log("req.user: ", req.user)
    console.log("req.user.id", req.user.id)
    console.log("req.user.clientId", req.user.clientId)
    req.token = req.token || {}
    req.token.accessToken = jwt.sign({
      id: req.user,
      clientId: req.user.clientId
    }, 'theycutthefleeb', {
      expiresIn: 60*10
    })
    console.log("req.token.accessToken", req.token.accessToken)
    next()
  }

  generateRefreshToken = (req, res, next) => {
    console.log("generateRefreshToken")
    req.token.refreshToken = req.user.clientId.toString() + '.' + crypto.randomBytes(
      40).toString('hex');
    console.log("req.token.refreshToken: ", req.token.refreshToken)
    dbSerialize.client.storeToken({
      id: req.user.clientId,
      refreshToken: req.token.refreshToken
    }, next);
  }

  const respond = (req, res, next) => {
    console.log("respond")
    console.log("req.user", req.user)
    console.log("req.token", req.token)
    console.log("isAuthenticated: ", req.isAuthenticated())
    res.status(200).json({
      user: req.user,
      token: req.token
    })
  }

  const validateRefreshToken = (req, res, next) => {
    console.log("validateRefreshToken")
    dbSerialize.client.findUserOfToken(req.body, (err, user) => {
      if(err) return next(err)
      console.log("req.user", req.user)
      req.user = user
      next()
    })
  }

  const respondToken = (req, res) => {
    console.log("respondToken")
    console.log("REQ.TOKEN", req.token)
    res.status(201).json({
      token: req.token
    })
  }

  app.post('/refreshAccessToken/', validateRefreshToken, generateAccessToken, respondToken)

  app.post('/registertoken/', passport.authenticate(
    'localtokenreg', {
      session: false
  }), serialize, serializeClient, generateAccessToken, generateRefreshToken, respond)

  app.post('/logintoken/', passport.authenticate(
    'localtokenauth', {
      session: false
    }
  ), serialize, serializeClient, generateAccessToken, generateRefreshToken, respond)

  app.use(authenticate)









//***********************************************************************************************************************
//MIDDLEWARE

  const getUser = (req, res, next) => {
    console.log("getUser")
    let userID
    if(typeof req.user.id === "string") userID = req.user.id
    if(typeof req.user.id === "object") userID = req.user.id.id
    usersCol.findOne({_id: new ObjectID(userID)})
      .then(user => {
        res.locals.username = user.username
        next()
      })
  }

  //requires getUser
  const getList = (req, res, next) => {
    console.log("getList")
    listsCol.findOne({$and: [{user: res.locals.username}, {selected: true}]}).then(list => {
      console.log(list)
      res.locals.listRef = list._id.toString()
      next()
    })
  }




  // get value from frontend******************************************************************************************
  



  const parseOrderNumberFromFrontEnd = (req, res, next) => {
    console.log("parseOrderNumberFromFrontEnd")
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    next()
  }

  const getTitleFromFrontEnd = (req, res, next) => {
    console.log("getTitleFromFrontEnd")
    console.log(req.body.title)
    res.locals.title = req.body.title
    next()
  }




  //******************************************************************************************************************************





  //requires getList, parseOrderNumberFromFrontEnd
  const getQueryDetailsForItem = (req, res, next) => {
    console.log("getQueryDetailsForItem")
    res.locals.details = {$and: [{list: res.locals.listRef}, {orderNumber: res.locals.orderNumber}]}
    next()
  }

  //requires getQueryDetailsForItem(getList, parseOrderNumberFromFrontEnd)
  const getItemByListAndOrderNumber = (req, res, next) => {
    console.log("getItemByListAndOrderNumber")
    //itemsCol.findOne({$and: [{list: res.locals.listRef}, {orderNumber: res.locals.orderNumber}]}).then(item => {
    itemsCol.findOne(res.locals.details).then(item => {
      res.locals.item = item
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber, called in item delete, item tab, item collapse
  const getDescendantsOfItem = (req, res, next) => {
    console.log("getDescendantsOfItem")
    res.locals.descendants = []
    itemsCol.find( {$and: [{orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef}]} ).sort({orderNumber: 1}).toArray()
    .then((possible) => {
      console.log("possible", possible)
      for(let i = 0; i < possible.length; i++) {
        if(possible[i].indentLevel > res.locals.item.indentLevel) { 
          res.locals.descendants.push(possible[i]) 
        }
        else break
      }
      next()
    })
  }

  const getUserParseOrderNumber = [getUser, parseOrderNumberFromFrontEnd]
  const getItemDetails = [getUser, getList, parseOrderNumberFromFrontEnd, getQueryDetailsForItem]
  const getItem = [getItemDetails, getItemByListAndOrderNumber]



  //******************************************************************************************************************************




  const toggleItemCollapseProp = (req, res, next) => {
    console.log("toggleItemCollapseProp")
    const dclpsd = JSON.parse(req.body.decollapsed)
    itemsCol.update(res.locals.details, {$set: {decollapsed: !dclpsd}})
      .then((item) => {next()})
  }

  const toggleDescendantsCollapseProp = (req, res, next) => {
    console.log('toggleDescendantsCollapseProp')
    const { descendants } = res.locals
    const dclpsd = JSON.parse(req.body.decollapsed)
    console.log("dclpsd", dclpsd)
    let dclpsdToRemain = [], stayHidden = false, descendantOrderNumbers = []
    for(let i = 0; i < descendants.length; i++) {
      if(descendants[i].decollapsed) dclpsdToRemain.push(descendants[i]._id.toString())
      for(let j = 0; j < dclpsdToRemain.length; j++) {
        if(descendants[i].parent === dclpsdToRemain[j]) {
          stayHidden = true
          break
        }
      }
      if(!stayHidden) {
        descendantOrderNumbers.push(descendants[i].orderNumber)
        itemsCol.update({_id: descendants[i]._id}, {$set: {hidden: !dclpsd}})
      }
    }
    res.send({index: descendantOrderNumbers})
  }

  const toggleItemCollapse = [toggleItemCollapseProp, getDescendantsOfItem, toggleDescendantsCollapseProp]







  //***************************************************************************************************************************************


  //LISTS


  //****************************************************************************************************************************************





  app.get('/lists/', getUser, (req, res) => {
    listsCol.find({ $query: {user: res.locals.username}, $orderby: { orderNumber : 1 } }).toArray()
    .then(lists => {
      res.send(lists)
    })
  })
  

  app.get('/lists/selected', getUser, (req, res) => {
    listsCol.findOne({$and: [{user: res.locals.username}, {selected: true}]})
    .then(list => {
      res.send({ index: list.orderNumber  })
    })
  })

  app.post('/lists/', [getUserParseOrderNumber], (req, res, next) => {
    const { username, orderNumber } = res.locals
    listsCol.updateMany({$and: [{user: username}, {orderNumber: {$gt: orderNumber}}]}, { $inc: {orderNumber: 1}})
    .then(updated => {
      return listsCol.insert({listTitle: '', orderNumber: orderNumber+1, selected: false, selectedItemIndex: 0, user: username})
    })
    .then(inserted => {
      return listsCol.findOne({$and: [{user: username}, {orderNumber: orderNumber+1}]})
    })
    .then(newList => {
      return itemsCol.insert({itemTitle: '', orderNumber: 0, parent: null, indentLevel: 0, list: newList._id.toString()})
    })
    .then(result => {
      console.log("RESULT")
      res.send(result)
    })
  })

  app.put('/lists/', [getUserParseOrderNumber, getTitleFromFrontEnd], (req, res, next) => {
    console.log("put lists")
    console.log(res.locals.username)
    console.log(res.locals.orderNumber)
    console.log(res.locals.title)
    listsCol.update({$and: [{user: res.locals.username}, {orderNumber: res.locals.orderNumber}]}, {$set: {listTitle: res.locals.title}})
    .then(result => {
      res.send(result)
    });
  });

  app.put('/lists/selected', [getUserParseOrderNumber], (req, res, next) => {
    const prevSelectedList = {$and: [{user: res.locals.username}, { selected: true }]}
    const nextSelectedList = {$and: [{user: res.locals.username}, { orderNumber: res.locals.orderNumber}]}
    listsCol.update(prevSelectedList, { $set: {selected: false}})
    .then(updatedPrev => {
      return listsCol.update(nextSelectedList, { $set: {selected: true}})
    })
    .then(updatedNext => {
      res.send(updatedNext)
    })
  })

  app.delete('/lists/', [getUserParseOrderNumber], (req, res, next) => {
    const { orderNumber, username } = res.locals
    listsCol.findOne({orderNumber: orderNumber})
    .then(list => {
      return itemsCol.deleteMany({$and: [{user: username}, {list: list._id.toString()}]})
    })
    .then(() => {
      return listsCol.remove({$and: [{user: username}, {orderNumber: orderNumber}]})
    })
    .then(() => {
      return listsCol.update({$and: [{user: username}, {orderNumber: {$gt: orderNumber}}]}, {$inc: {orderNumber : -1}})
    })
    .then(result => {
      res.send(result)
    })
  })




//****************************************************************************************************************************************


//ITEMS


//****************************************************************************************************************************************


//GET

  app.get('/items/', getUser, getList, (req, res) => {
    const { username, listRef } = res.locals
    itemsCol.find({ $query: {list: listRef}, $orderby: { orderNumber : 1 } }).toArray((err, items) => {
      if (err) res.send({'error':'An error has occurred'});
      else res.send(items); 
    });
  });

  app.get('/items/selected/', getUser, (req, res) => {
    const { username } = res.locals
    db.collection('lists').findOne({$and: [{user: username}, {selected: true}]})
      .then(list => {
        console.log("list", list)
        res.send({index: list.selectedItemIndex})
      })
  })


//****************************************************************************************************************************************


//POST

  //requires getList, parseOrderNumberFromFrontEnd
  const getNextItemByListAndOrderNumber = (req, res, next) => {
    console.log("getNextItemByListAndOrderNumber")
    const { listRef, orderNumber } = res.locals
    itemsCol.findOne({$and: [{list: listRef}, {orderNumber: orderNumber + 1}]}).then(item => {
      res.locals.nextItem = item
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd
  const incrementOrderNumbers = (req, res, next) => {
    console.log("incrementOrderNumbers")
    console.log(res.locals.orderNumber)
    itemsCol.updateMany({$and: [{list: res.locals.listRef}, {orderNumber: {$gt: res.locals.orderNumber}}]}, { $inc: {orderNumber: 1}})
    .then(result => {
      next()
    })
  }

  //SPECIFIC TO ITEM POST ROUTE HANDLER
  const insertAfterOrderNumbersAdjustment = (req, res, next) => {
    console.log("insertAfterOrderNumbersAdjustment")
    console.log(res.locals.newItemProps)
    itemsCol.insert(res.locals.newItemProps).then(newItem => {
      res.locals.createdItem = newItem
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd
  const selectNewItem = (req, res, next) => {
    console.log("selectNewItem")
    listsCol.update({_id: new ObjectID(res.locals.listRef)}, {$set: {selectedItemIndex: res.locals.orderNumber + 1}}).then(() => {
      next()
    })
  }

  app.post('/items/', [getItem, getNextItemByListAndOrderNumber, getDescendantsOfItem], (req, res, next) => {
    const { nextItem, item, orderNumber, listRef, descendants } = res.locals
    let parentRef, indentLevel
    if(nextItem != null && nextItem.parent == item._id.toString() && !nextItem.hidden) {
      parentRef = item._id.toString()
      indentLevel = item.indentLevel + 1
    }
    else {
      parentRef = item.parent
      indentLevel = item.indentLevel
    }
    if(nextItem != null && nextItem.hidden) {
      console.log('descendants', descendants)
      console.log('lastDescendant', descendants[descendants.length-1])
      res.locals.orderNumber = descendants[descendants.length-1].orderNumber
      console.log("new res.locals.oN", res.locals.orderNumber)
    }
    res.locals.newItemProps = { itemTitle: '', 
      orderNumber: res.locals.orderNumber + 1, 
      parent: parentRef, 
      indentLevel: indentLevel, 
      list: listRef, 
      checked: false,
      hidden: false,
      decollapsed: false
    }
    next()
  }, [incrementOrderNumbers, insertAfterOrderNumbersAdjustment, selectNewItem], (req, res, next) => {
    res.send(res.locals.createdItem.ops[0])
  })




//****************************************************************************************************************************************


//PUT




  app.put('/items/', [getItemDetails, getTitleFromFrontEnd], (req, res, next) => {
    const { details, title } = res.locals
    itemsCol.update(details, { $set: {itemTitle: title} }).then(result => {
      res.send(result)
    })
  })


  app.put('/items/check/', [getItemDetails], (req, res, next) => {
    const checked = JSON.parse(req.body.checked)
    itemsCol.update(res.locals.details, {$set: {checked: checked}})
    .then(result => {
      res.send(result)
    })
  })



  //requires getUser, parseOrderNumberFromFrontEnd, called in 1 route
  const selectItem = (req, res, next) => {
    console.log("selectItem")
    const { username, orderNumber } = res.locals
    listsCol.update({$and: [{user: username}, {selected: true}]}, {$set: {selectedItemIndex: orderNumber}})
    .then((result) => {
      next()
    })
  }

  app.put('/items/selected/', [getUserParseOrderNumber, selectItem], (req, res) => {
    res.send("something")
  });





  //requires getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber
  const getNearestSiblingAbove = (req, res, next) => {
    console.log("getNearestSiblingAbove")
    const { item, orderNumber, listRef } = res.locals
    itemsCol.find({$and: [{parent: item.parent}, {orderNumber: {$lt: orderNumber}}, {list: listRef}]}).sort({orderNumber: -1}).limit(1).next()
    .then(sibling => {
      res.locals.nearestSiblingAbove = sibling
      next()
    })
  }

  //requires getDescendantsOfItem
  const incrementDescendantIndentLevels = (req, res, next) => {
    console.log("incrementDescendantIndentLevels")
    res.locals.descendants.forEach(descendant => {
      itemsCol.update({_id: descendant._id}, {$inc: {indentLevel: 1}})
    })
    next()
  }

  app.put('/items/tab', [getItem, getNearestSiblingAbove], (req, res, next) => {
    const { details, nearestSiblingAbove } = res.locals
    itemsCol.update(details, {$set: {parent: nearestSiblingAbove._id.toString()}, $inc: {indentLevel: 1}})
    .then(() => {
      next()
    })
  }, [getDescendantsOfItem, incrementDescendantIndentLevels], (req, res, next) => {
    res.send()
  })







  //requires getItemByListAndOrderNumber
  const getParentItem = (req, res, next) => {
    console.log("getParentItem")
    itemsCol.findOne({_id: new ObjectID(res.locals.item.parent)}).then((item) => {
      res.locals.parentItem = item
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber
  const getChildrenItems = (req, res, next) => {
    console.log("getChildrenItems")
    const { listRef, orderNumber, item } = res.locals
    itemsCol.find({ $and: [ {indentLevel: {$gt: item.indentLevel}}, {orderNumber: {$gt: orderNumber}}, {list: listRef} ]}).sort({orderNumber: 1}).toArray()
    .then(children => {
      res.locals.childrenItems = children
      next()
    })
  }

  app.put('/items/untab', [getItem], (req, res, next) => {
    const { item, orderNumber, listRef } = res.locals
    const siblingsToChildrenProps = {$and: [ {parent: {$eq: item.parent}}, {orderNumber: {$gt: orderNumber}}, {list: listRef} ]}
    itemsCol.updateMany(siblingsToChildrenProps, {$set: {parent: item._id}})
    next()
  }, [getQueryDetailsForItem, getParentItem], (req, res, next) => {
    let parentToSet = null
    const { parentItem, details } = res.locals
    if(parentItem != null) parentToSet = parentItem.parent
    itemsCol.update(details, { $set: {parent: parentToSet}, $inc:{indentLevel: -1}})
    next()
  }, [getChildrenItems], (req, res, next) => {
    const { childrenItems, orderNumber, listRef } = res.locals
    for(let i = 0; i < childrenItems.length; i++) {
      if(childrenItems[i].orderNumber == orderNumber + 1 + i) {
        itemsCol.update({$and: [{orderNumber: orderNumber + 1 + i}, {list: listRef}]}, { $inc:{indentLevel: -1} })
      }
      else break
    }
    res.send()
  })


  app.put('/items/collapse/', [getItem, toggleItemCollapse])






//****************************************************************************************************************************************

//DELETE




  //requires getQueryDetailsForItem(getList, parseOrderNumberFromFrontEnd)
  const removeItemByOrderNumber = (req, res, next) => {
    console.log("removeItemByOrderNumber")
    itemsCol.remove(res.locals.details)
    .then(removed => {
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd
  const decrementOrderNumbers = (req, res, next) => {
    console.log("decrementOrderNumbers")
    itemsCol.updateMany({$and: [{list: res.locals.listRef}, {orderNumber: {$gt: res.locals.orderNumber}}]}, { $inc: {orderNumber: -1}})
    .then(result => {
      next()
    })
  }

  //requires getItemByListAndOrderNumber, getDescendantsOfItem, getList
  const updateDescendantsAfterDelete = (req, res, next) => {
    console.log("updateDescendantsAfterDelete")
    const { descendants, item, listRef } = res.locals
    descendants.forEach(descendant => {
      console.log('descendant', descendant)
      itemsCol.update({_id: descendant._id}, {$inc: {indentLevel: -1}})
    })
    itemsCol.updateMany({ $and: [{parent: item._id.toString()}, {list: listRef}]}, {$set: {parent: item.parent}})
    next()
  }

  //requires parseOrderNumberFromFrontEnd, called in 1 route
  const selectPreviousItemAfterDelete = (req, res, next) => {
    console.log("selectPreviousItemAfterDelete")
    if(res.locals.orderNumber == 0) res.locals.nextSelectedIndex = 0
    else res.locals.nextSelectedIndex = res.locals.orderNumber - 1
    listsCol.update({_id: new ObjectID(res.locals.listRef)}, {$set: {selectedItemIndex: res.locals.nextSelectedIndex}}).then(() => {
      next()
    })
  }

  app.delete('/items/', [getItem, getDescendantsOfItem, removeItemByOrderNumber, decrementOrderNumbers, 
    updateDescendantsAfterDelete, selectPreviousItemAfterDelete], (req, res) => {
    res.send()
  })



//****************************************************************************************************************************************















//******************************************************************************************************************************

  //REDO
  //const liftDescendantIndentLevelsAndRemoveItem = (req, res, next) => {
  const liftDescendantIndentLevelsAndRemoveItem = (id, on, parent, il, listRef) => {
    console.log("here???")
    //const on = req.onOfItemToBeRemoved //from .findOne()
    //const listRef = req.listRef

    let descendants = []

    itemsCol.find( {$and: [{orderNumber: {$gt: on}}, {list: listRef}]} ).sort({orderNumber: 1}).toArray()
      .then((possibleDescendants) => {
        for(let i = 0; i < possibleDescendants.length; i++) {
          if(possibleDescendants[i].indentLevel > il) { 
            descendants.push(possibleDescendants[i]) 
          }
          else {
            break
          }
        }
        descendants.forEach((descendant) => {
          itemsCol.update({_id: descendant._id}, {$inc: {indentLevel: -1}})
        })
        itemsCol.updateMany({ $and: [{parent: id.toString()}, {list: listRef}]}, {$set: {parent: parent}})
        return
      })
  }

  //not done yet

  
  app.delete('/items/trash/', getUser, getList, (req, res) => {
    let incValue//, selectedItemIndex
    itemsCol.find({$and: [{checked: true}, {list: res.locals.listRef}]}).sort({orderNumber: 1}).toArray()
      .then(checkedItems => {
        incValue = checkedItems[0].orderNumber
        for(let i = 0; i < checkedItems.length; i++) {
          liftDescendantIndentLevelsAndRemoveItem(checkedItems[i]._id, checkedItems[i].orderNumber, checkedItems[i].parent, checkedItems[i].indentLevel, res.locals.listRef)
          itemsCol.remove({_id: checkedItems[i]._id})
        }
        return
      })
      .then(() => {
        return itemsCol.find({$and: [{orderNumber: {$gt: incValue}}, {list: res.locals.listRef}]}).sort({orderNumber: 1}).toArray()
      })
      .then(itemsToShiftDown => {
        for(let i = 0; i < itemsToShiftDown.length; i++) {
          itemsCol.update({_id: itemsToShiftDown[i]._id}, {$set: {orderNumber: i + incValue}})
        }
        return listsCol.update({$and: [{user: req.user.id}, {selected: true}]}, {$set: {selectedItemIndex: 0}})
      })
      .then((result) => {
        res.send(result)
      })
  })

    
        

  




}
