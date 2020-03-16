var ObjectID = require('mongodb').ObjectID;
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const express = require('express')
const router = express.Router()

const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const authenticate = expressJwt({secret: 'theycutthefleeb'})

const bcrypt = require('bcryptjs')
const crypto = require('crypto');


module.exports = function(app, db) {

  const listsCol = db.collection('lists')
  const itemsCol = db.collection('items')
  const usersCol = db.collection('localusers')
  

  const isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
      return next()
    }
    res.redirect('/')
  }

  app.get('/users/', authenticate, isLoggedIn, (req, res) => {
    res.send()
  })

  const dbSerialize = {
    user: {
      updateOrCreate: (user, cb) => {
        cb(null, user)
      },
      authenticate: (un, pw, cb) => {
        usersCol.findOne({username: un})
        .then(result => {
          if(null == result) {} 
          else {
            hash = result.password
            if(bcrypt.compareSync(pw, hash)) {
              cb(null, result)
              return
            }
            else {
              cb(null, false)
            }
          }
        })
      },
      register: (un, pw, cb) => {
        usersCol.findOne({username: un})
        .then(result => {
          if(null != result) {
            return console.log("USERNAME ALREADY EXISTS: ", result.username)
            cb(null, false)
          }
          else {
            const hash = bcrypt.hashSync(pw, 8)
            const newUser = {
              username: un,
              password: hash,
              selectedListIndex: 0
            }
            listsCol.insert({listTitle: "New List", orderNumber: 0, selected: true, selectedItemIndex: 0, user: un})
            .then(listInserted => {
              return listsCol.findOne({user: un})
            })
            .then(newList => {
              return itemsCol.insert({itemTitle: '', orderNumber: 0, parent: null, indentLevel: 0, list: newList._id.toString()}) 
            })
            .then(itemInserted => {
              return usersCol.insert(newUser)
            })
            .then(inserted => {
              cb(null, inserted.ops[0])
            })
          }
        })
      }
    },

    client: {
      updateOrCreate: (data, cb) => {
        db.collection('localclients').insert({user: data.user})
        .then(inserted => {
          cb(null, {id: inserted.ops[0]._id})
        })
      },
      storeToken: (data, cb) => {
        db.collection('localclients').findOneAndUpdate({_id: data.id}, {$set: {refreshToken: data.refreshToken}})
        .then(client => {
          cb()
        })
      },
      findUserOfToken: (data, cb) => {
        if(!data.refreshToken) return cb(new Error('invalid token'))
        db.collection('localclients').findOne({refreshToken: data.refreshToken})
        .then(client => {
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
    dbSerialize.user.updateOrCreate(req.user, (err, user) => {
      if(err) return next(err)
      req.user = user._id
      next()
  })}

  serializeClient = (req, res, next) => {  
    dbSerialize.client.updateOrCreate({
      user: req.user
    }, (err, client) => {
      if (err) {
        return next(err);
      }
      req.user.clientId = client.id;
      next()
    });
  }

  const generateAccessToken = (req, res, next) => {
    req.token = req.token || {}
    req.token.accessToken = jwt.sign({
      id: req.user,
      clientId: req.user.clientId
    }, 'theycutthefleeb', {
      expiresIn: 60*10
    })
    next()
  }

  generateRefreshToken = (req, res, next) => {
    req.token.refreshToken = req.user.clientId.toString() + '.' + crypto.randomBytes(
      40).toString('hex');
    dbSerialize.client.storeToken({
      id: req.user.clientId,
      refreshToken: req.token.refreshToken
    }, next);
  }

  const respond = (req, res, next) => {
    res.status(200).json({
      user: req.user,
      token: req.token
    })
  }

  const validateRefreshToken = (req, res, next) => {
    dbSerialize.client.findUserOfToken(req.body, (err, user) => {
      if(err) return next(err)
      req.user = user
      next()
    })
  }

  const respondToken = (req, res) => {
    res.status(201).json({
      token: req.token
    })
  }

  const nukeTestUser = (req, res, next) => {
    listsCol.findOne({ $and: [{user: 'TESTePU3ieiI7X'}, {orderNumber: 0}]})
    .then(list => {
      return itemsCol.deleteMany({list: list._id.toString()});
    })
    .then((deleted) => {
      return listsCol.findOne({ $and: [{user: 'TESTePU3ieiI7X'}, {orderNumber: 1}]})
    })
    .then(list => {
      return itemsCol.deleteMany({list: list._id.toString()});
    })
    .then(() => {
      return listsCol.deleteMany({user: 'TESTePU3ieiI7X'});
    })
    .then(() => {
      next();
    })
  }

  const populateTestUser = (req, res, next) => {
    listsCol.insert({listTitle: 'Useage', orderNumber: 0, selected: true, selectedItemIndex: 0, user: 'TESTePU3ieiI7X'})
    .then(inserted => {
      return listsCol.findOne({$and: [{user: 'TESTePU3ieiI7X'}, {orderNumber: 0}]})
    })
    .then(newList => {
      res.locals.currentList = newList._id.toString()
      return itemsCol.insert({itemTitle: 'use arrowkeys up and down to select through items', orderNumber: 0, parent: null, indentLevel: 0, list: res.locals.currentList, checked: false})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'check/uncheck this item using the \"/\" key', orderNumber: 1, parent: null, indentLevel: 0, list: res.locals.currentList, hidden: false, checked: true})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'press arrowkey right highlighted on an item with a large checkbox to collapse its hidden sub items', orderNumber: 2, parent: null, indentLevel: 0, list: res.locals.currentList, hidden: false, decollapsed: true})
    })
    .then(inserted => {
      res.locals.currentParent = inserted.ops[0]._id.toString()
      return itemsCol.insert({itemTitle: 'hit enter to create a new item', orderNumber: 3, parent: res.locals.currentParent, indentLevel: 1, list: res.locals.currentList, hidden: true})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'hit enter after editing item to save', orderNumber: 4, parent: res.locals.currentParent, indentLevel: 1, list: res.locals.currentList, hidden: true})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'hit tab on an item to subcategorize it to the item above', orderNumber: 5, parent: res.locals.currentParent, indentLevel: 1, list: res.locals.currentList, hidden: true})
    })
    .then(inserted => {
      res.locals.currentParent = inserted.ops[0]._id.toString()
      return itemsCol.insert({itemTitle: 'hit shift-tab to remove an item from its category', orderNumber: 6, parent: res.locals.currentParent, indentLevel: 2, list: res.locals.currentList, hidden: true})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'recollapse an item with subitems with arrowkey left', orderNumber: 7, parent: res.locals.currentParent, indentLevel: 2, list: res.locals.currentList, hidden: true})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'edit items using shift-enter, hit enter to save', orderNumber: 8, parent: null, indentLevel: 0, list: res.locals.currentList, hidden: false})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'delete an item using shift-backspace, or backspace an empty item while editing', orderNumber: 9, parent: null, indentLevel: 0, list: res.locals.currentList, hidden: false})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'use shift-left to enter lists menu, use up and down to navigate when you are there', orderNumber: 10, parent: null, indentLevel: 0, list: res.locals.currentList, hidden: false})
    })
    .then(inserted => {
      return listsCol.insert({listTitle: 'More Usage', orderNumber: 1, selected: false, selectedItemIndex: 0, user: 'TESTePU3ieiI7X'})
    })
    .then(inserted => {
      return listsCol.findOne({$and: [{user: 'TESTePU3ieiI7X'}, {orderNumber: 1}]})
    })
    .then(newList => {
      res.locals.currentList = newList._id.toString()
      return itemsCol.insert({itemTitle: 'just as with items in the right column:', orderNumber: 0, parent: null, indentLevel: 0, list: res.locals.currentList})
    })
    .then(inserted => {
      res.locals.levOneParent = inserted.ops[0]._id.toString()
      return itemsCol.insert({itemTitle: 'enter creates a new list right under', orderNumber: 1, parent: res.locals.levOneParent, indentLevel: 1, list: res.locals.currentList})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'shift-enter allows for editing, enter to save', orderNumber: 2, parent: res.locals.levOneParent, indentLevel: 1, list: res.locals.currentList})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: 'you can delete list by hitting backspace while editing if there are no more characters', orderNumber: 3, parent: res.locals.levOneParent, indentLevel: 1, list: res.locals.currentList})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: "hit shift-alt-backspace to completely delete list, ALL of its items will be deleted too", orderNumber: 4, parent: null, indentLevel: 0, list: res.locals.currentList})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: "re-enter selected list by hitting shift-arrowright", orderNumber: 5, parent: null, indentLevel: 0, list: res.locals.currentList})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: "remove all checked items by hitting the trash button in the top right corner", orderNumber: 6, parent: null, indentLevel: 0, list: res.locals.currentList})
    })
    .then(() => {
      return itemsCol.insert({itemTitle: "once again, to reenter lists, hit shift-arrowleft", orderNumber: 7, parent: null, indentLevel: 0, list: res.locals.currentList})
    })
    .then(inserted => {
      next();
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

  app.post('/testtoken/', passport.authenticate(
    'localtokenauth', {
      session: false
    }
  ), serialize, serializeClient, generateAccessToken, generateRefreshToken, nukeTestUser, populateTestUser, respond)

  app.use(authenticate)


  const getUser = (req, res, next) => {
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
    listsCol.findOne({$and: [{user: res.locals.username}, {selected: true}]}).then(list => {
      res.locals.listRef = list._id.toString()
      next()
    })
  }

  const parseOrderNumberFromFrontEnd = (req, res, next) => {
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    next()
  }

  const parseNewOrderNumberFromFrontEnd = (req, res, next) => {
    res.locals.newOrderNumber = parseInt(req.body.newOrderNumber)
    next()
  }

  const getTitleFromFrontEnd = (req, res, next) => {
    res.locals.title = req.body.title
    next()
  }


  //requires getList, parseOrderNumberFromFrontEnd
  const getQueryDetailsForItem = (req, res, next) => {
    res.locals.details = {$and: [{list: res.locals.listRef}, {orderNumber: res.locals.orderNumber}]}
    next()
  }

  //requires getQueryDetailsForItem(getList, parseOrderNumberFromFrontEnd)
  const getItemByListAndOrderNumber = (req, res, next) => {
    //itemsCol.findOne({$and: [{list: res.locals.listRef}, {orderNumber: res.locals.orderNumber}]}).then(item => {
    itemsCol.findOne(res.locals.details).then(item => {
      res.locals.item = item
      next()
    })
  }

  const getItemAtNewOrderNumber = (req, res, next) => {
    itemsCol.findOne({$and: [{list: res.locals.listRef}, {orderNumber: res.locals.newOrderNumber}]}).then(item => {
      res.locals.newOrderNumberItem = item
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber, called in item delete, item tab, item collapse
  const getDescendantsOfItem = (req, res, next) => {
    res.locals.descendants = []
    itemsCol.find( {$and: [{orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef}]} ).sort({orderNumber: 1}).toArray()
    .then((possible) => {
      for(let i = 0; i < possible.length; i++) {
        if(possible[i].indentLevel > res.locals.item.indentLevel) { 
          res.locals.descendants.push(possible[i]) 
        }
        else break
      }
      next()
    })
  }

  const getDescendantsOfItemAtNewOrderNumber = (req, res, next) => {
    res.locals.newItemDescendants = []
    itemsCol.find( {$and: [{orderNumber: {$gt: res.locals.newOrderNumber}}, {list: res.locals.listRef}]} ).sort({orderNumber: 1}).toArray()
    .then((possible) => {
      for(let i = 0; i < possible.length; i++) {
        if(possible[i].indentLevel > res.locals.newOrderNumberItem.indentLevel) { 
          res.locals.newItemDescendants.push(possible[i]) 
        }
        else break
      }
      next()
    })
  }

  const getUserParseOrderNumber = [getUser, parseOrderNumberFromFrontEnd]
  const getItemDetails = [getUser, getList, parseOrderNumberFromFrontEnd, getQueryDetailsForItem]
  const getItem = [getItemDetails, getItemByListAndOrderNumber]
  const getItemAtNewOrderNumberAndDescendants = [parseNewOrderNumberFromFrontEnd, getItemAtNewOrderNumber, getDescendantsOfItemAtNewOrderNumber]

  const toggleItemCollapseProp = (req, res, next) => {
    const dclpsd = JSON.parse(req.body.decollapsed)
    itemsCol.update(res.locals.details, {$set: {decollapsed: !dclpsd}})
      .then((item) => {next()})
  }

  const toggleDescendantsCollapseProp = (req, res, next) => {
    const { descendants } = res.locals
    const dclpsd = JSON.parse(req.body.decollapsed)
    let dclpsdToRemain = [], stayHidden, descendantOrderNumbers = []
    for(let i = 0; i < descendants.length; i++) {
      stayHidden = false;
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
      res.send(result)
    })
  })

  app.put('/lists/', [getUserParseOrderNumber, getTitleFromFrontEnd], (req, res, next) => {
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

  app.get('/items/', getUser, getList, (req, res) => {
    const { username, listRef } = res.locals
    itemsCol.find({ $query: {list: listRef}, $orderby: { orderNumber : 1 } }).toArray((err, items) => {
      if (err) res.send({'error':'An error has occurred'});
      else res.send(items); 
    });
  });

  app.get('/items/selected/', getUser, (req, res) => {
    const { username } = res.locals
    listsCol.findOne({$and: [{user: username}, {selected: true}]})
      .then(list => {
        res.send({index: list.selectedItemIndex})
      })
  })

  //requires getList, parseOrderNumberFromFrontEnd
  const getNextItemByListAndOrderNumber = (req, res, next) => {
    const { listRef, orderNumber } = res.locals
    itemsCol.findOne({$and: [{list: listRef}, {orderNumber: orderNumber + 1}]}).then(item => {
      res.locals.nextItem = item
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd
  const incrementOrderNumbers = (req, res, next) => {
    itemsCol.updateMany({$and: [{list: res.locals.listRef}, {orderNumber: {$gt: res.locals.orderNumber}}]}, { $inc: {orderNumber: 1}})
    .then(result => {
      next()
    })
  }

  //SPECIFIC TO ITEM POST ROUTE HANDLER
  const insertAfterOrderNumbersAdjustment = (req, res, next) => {
    itemsCol.insert(res.locals.newItemProps).then(newItem => {
      res.locals.createdItem = newItem
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd
  const selectNewItem = (req, res, next) => {
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
      res.locals.orderNumber = descendants[descendants.length-1].orderNumber
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
    const { item, orderNumber, listRef } = res.locals
    itemsCol.find({$and: [{parent: item.parent}, {orderNumber: {$lt: orderNumber}}, {list: listRef}]}).sort({orderNumber: -1}).limit(1).next()
    .then(sibling => {
      res.locals.nearestSiblingAbove = sibling
      next()
    })
  }

  //requires getDescendantsOfItem
  const incrementDescendantIndentLevels = (req, res, next) => {
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
    res.send({})
  })

  //requires getItemByListAndOrderNumber
  const getParentItem = (req, res, next) => {
    itemsCol.findOne({_id: new ObjectID(res.locals.item.parent)}).then((item) => {
      res.locals.parentItem = item
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber
  const getChildrenItems = (req, res, next) => {
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
    if(parentItem != null) {
      parentToSet = parentItem.parent
      itemsCol.update(details, { $set: {parent: parentToSet}, $inc:{indentLevel: -1}})
    }
    next()
  }, [getChildrenItems], (req, res, next) => {
    const { childrenItems, orderNumber, listRef } = res.locals
    for(let i = 0; i < childrenItems.length; i++) {
      if(childrenItems[i].orderNumber == orderNumber + 1 + i) {
        itemsCol.update({$and: [{orderNumber: orderNumber + 1 + i}, {list: listRef}]}, { $inc:{indentLevel: -1} })
      }
      else break
    }
    res.send({})
  })

  //app.put('/items/collapse/', [getItem, toggleItemCollapse])
  //app.put('/items/decollapse/', [getItem, toggleItemCollapse])

  const shouldItemRemainHidden = (item, itemToggled, potentialParents) => {
    console.log('item', item)
    console.log('potentialParents', potentialParents)
		const parent = potentialParents.find(i => i._id.toString() === item.parent)
		if(!parent) {
			console.log('!')
			return false
		}
		if(parent._id.toString() === itemToggled._id.toString()) {
			console.log('@')
			return false
		}
		if(parent.decollapsed) {
			console.log('#')
			return true
		}
		return shouldItemRemainHidden(parent, itemToggled, potentialParents)
	}
  
  app.put('/items/collapse/', [getItem, toggleItemCollapseProp, getDescendantsOfItem], (req, res, next) => {
    const { item, descendants } = res.locals
    console.log('descendants', descendants, 'item', item)
    const itemWithDescendants = [item, ...descendants]
    const sortedItems = itemWithDescendants.sort((a, b) => a.orderNumber - b.orderNumber)
    const sortedDescendants = descendants.sort((a, b) => a.orderNumber - b.orderNumber)
    for(let i = 0; i < sortedDescendants.length; i++) {
      /*
      const potentialParents = sortedItems.filter(it => it.orderNumber < sortedDescendants[i].orderNumber && it.indentLevel === sortedDescendants[i].indentLevel - 1)
      console.log('potentialParents', potentialParents)
      const parent = potentialParents.reduce((a, b) => Math.max(a.orderNumber, b.orderNumber))
      
      if(parent.orderNumber === item.orderNumber || !parent.decollapsed) {
        console.log('updating descendant to hidden false', descendants[i])
        itemsCol.update({_id: sortedDescendants[i]._id}, {$set: {hidden: false}})
      }
      */
      if(!shouldItemRemainHidden(sortedDescendants[i], item, itemWithDescendants)) {
        itemsCol.update({_id: sortedDescendants[i]._id}, {$set: {hidden: false}})
      }
    }
    res.send({})
  })


  app.put('/items/decollapse/', [getItem, toggleItemCollapseProp, getDescendantsOfItem], (req, res, next) => {
    const { item, descendants } = res.locals
    console.log('descendants', descendants, 'item', item)
    const sortedDescendants = descendants.sort((a, b) => a.orderNumber - b.orderNumber)
    for(let i = 0; i < sortedDescendants.length; i++) {
      if(!sortedDescendants[i].hidden) {
        itemsCol.update({_id: sortedDescendants[i]._id}, {$set: {hidden: true}})
      }
    }
    res.send({})
  })

  //requires getQueryDetailsForItem(getList, parseOrderNumberFromFrontEnd)
  const removeItemByOrderNumber = (req, res, next) => {
    itemsCol.remove(res.locals.details)
    .then(removed => {
      next()
    })
  }

  //requires getList, parseOrderNumberFromFrontEnd
  const decrementOrderNumbers = (req, res, next) => {
    itemsCol.updateMany({$and: [{list: res.locals.listRef}, {orderNumber: {$gt: res.locals.orderNumber}}]}, { $inc: {orderNumber: -1}})
    .then(result => {
      next()
    })
  }

  //requires getItemByListAndOrderNumber, getDescendantsOfItem, getList
  const updateDescendantsAfterDelete = (req, res, next) => {
    const { descendants, item, listRef } = res.locals
    if(descendants.length !== 0) {
      descendants.forEach(descendant => {
        itemsCol.update({_id: descendant._id}, {$inc: {indentLevel: -1}})
      })
      itemsCol.updateMany({ $and: [{parent: item._id.toString()}, {list: listRef}]}, {$set: {parent: item.parent}})
    }
    next()
  }

  //requires parseOrderNumberFromFrontEnd, called in 1 route
  const selectPreviousItemAfterDelete = (req, res, next) => {
    if(res.locals.orderNumber == 0) res.locals.nextSelectedIndex = 0
    else res.locals.nextSelectedIndex = res.locals.orderNumber - 1
    //MAKE SURE ALL ITEMS BEGIN WIth HIDDEN SET TO FALSE, BUG IF ITEM AT ON 0 HAS NO HIDDEN VALUE
    itemsCol.find({$and: [{hidden: false}, {list: res.locals.listRef}, {orderNumber: {$lt: res.locals.orderNumber}}]}).sort({orderNumber: -1}).limit(1).next()
    .then(item => {
      return listsCol.update({_id: new ObjectID(res.locals.listRef)}, {$set: {selectedItemIndex: item.orderNumber}})
    })
    .then(()=> {
      next()
    })
  }

  app.delete('/items/', [getItem, getDescendantsOfItem, removeItemByOrderNumber, decrementOrderNumbers, 
    updateDescendantsAfterDelete, selectPreviousItemAfterDelete], (req, res) => {
    res.send({})
  })

  const liftDescendantIndentLevelsAndRemoveItem = (id, on, parent, il, listRef) => {

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

  app.put('/items/reorder', [getItem, getDescendantsOfItem, getItemAtNewOrderNumberAndDescendants], (req, res, next) => {
    const { orderNumber, item, descendants, listRef, newOrderNumber, newOrderNumberItem, newItemDescendants } = res.locals
    const lowerRange = (orderNumber < req.body.newOrderNumber ? (orderNumber + descendants.length + 1) : req.body.newOrderNumber)
    const upperRange = (orderNumber < req.body.newOrderNumber ? (req.body.newOrderNumber + newItemDescendants.length) : (orderNumber - 1))
    const inc = (descendants.length+1) * (orderNumber < req.body.newOrderNumber ? -1 : 1)
    itemsCol.updateMany({$and: [{list: listRef}, {orderNumber: {$gte: lowerRange}}, {orderNumber: {$lte: upperRange}}]}, { $inc: {orderNumber: inc}})
    .then(() => {
      res.locals.descendantInc = (orderNumber < req.body.newOrderNumber ? req.body.newOrderNumber - orderNumber - descendants.length + newItemDescendants.length : req.body.newOrderNumber - orderNumber)
      res.locals.indLevInc = newOrderNumberItem.indentLevel - item.indentLevel;
      res.locals.newParent = newOrderNumberItem.parent;
      for(let i = 0; i < descendants.length; i++) {
        itemsCol.findOneAndUpdate({_id: descendants[i]._id}, {$inc: {orderNumber: res.locals.descendantInc, indentLevel: res.locals.indLevInc}})
      }
      return
    })
    .then(() => {
      return itemsCol.findOneAndUpdate({_id: item._id}, {$inc: {orderNumber: res.locals.descendantInc, indentLevel: res.locals.indLevInc}, $set: {parent: res.locals.newParent}})
    })
    .then(() => {
      res.send()
    })
  })

}
