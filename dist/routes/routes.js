var ObjectID = require('mongodb').ObjectID;



module.exports = function(app, db) {


  app.post('/signup/', (req, res) => {
    if(req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
      const userData = {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        passwordConf: req.body.passwordConf,
      }
      db.createUser(
        {
          user: req.body.username,
          pwd: req.body.password,
          roles: [
            {role: "readWrite", db: "nodejsapitutdb"}
          ]
      })
    }

  })

  app.post('/login/', (req, res) => {

  })





  
  const listsCol = db.collection('lists')
  const itemsCol = db.collection('items')

  //get from frontend
  const parseOrderNumberFromFrontEnd = (req, res, next) => {
    console.log("parseOrderNumberFromFrontEnd")
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    console.log(res.locals.orderNumber)
    next()
  }

  const getTitleFromFrontEnd = (req, res, next) => {
    console.log("getTitleFromFrontEnd")
    console.log(parseInt(req.body.orderNumber))
    res.locals.title = req.body.title
    next()
  }
  //******************


  const getList = (req, res, next) => {
    console.log("getList")
    listsCol.findOne({selected: true}).then(list => {
      res.locals.listRef = list._id.toString()
      next()
    })
  }

  const getItemByListAndOrderNumber = (req, res, next) => {
    console.log("getItemByListAndOrderNumber")
    itemsCol.findOne({list: res.locals.listRef, orderNumber: res.locals.orderNumber}).then(item => {
      console.log("here?")
      res.locals.item = item
      next()
    })
  }

  const getNextItemByListAndOrderNumber = (req, res, next) => {
    console.log("getNextItemByListAndOrderNumber")
    itemsCol.findOne({list: res.locals.listRef, orderNumber: res.locals.orderNumber + 1}).then(item => {
      res.locals.nextItem = item
      next()
    })
  }

  const incrementOrderNumbers = (req, res, next) => {
    console.log("incrementOrderNumbers")
    itemsCol.updateMany({$and: [{orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef}]}, { $inc: {orderNumber: 1}}).then((result) => {
      next()
    })
  }

  const decrementOrderNumbers = (req, res, next) => {
    console.log("decrementOrderNumbers")
    itemsCol.updateMany({$and: [{orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef}]}, { $inc: {orderNumber: -1}}).then((result) => {
      next()
    })
  }

  const insertAfterOrderNumbersAdjustment = (req, res, next) => {
    console.log("insertAfterOrderNumbersAdjustment")
    itemsCol.insert(res.locals.newItemProps).then((newItem) => {
      res.locals.createdItem = newItem
      next()
    })
  }

  const removeItemByOrderNumber = (req, res, next) => {
    console.log("removeItemByOrderNumber")
    itemsCol.remove({$and: [{orderNumber: res.locals.orderNumber}, {list: res.locals.listRef}]})
    .then(() => {
      next()
    })
  }


  const updateSelectedItemIndex = (req, res, next) => {
    console.log("updateSelectedItemIndex")
    listsCol.update({selected: true}, {$set: {selectedItemIndex: res.locals.nextItemOrderNumber}}).then(() => {
      next()
    })
  }

  const getDescendantsOfItem = (req, res, next) => {
    console.log("getDescendantsOfItem")
    res.locals.descendants = []
    itemsCol.find( {$and: [{orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef}]} ).sort({orderNumber: 1}).toArray().then((possible) => {
      console.log(possible)
      for(let i = 0; i < possible.length; i++) {
        if(possible[i].indentLevel > res.locals.item.indentLevel) { 
          res.locals.descendants.push(possible[i]) 
        }
        else break
      }
      next()
    })
  }

  const updateDescendantsAfterDelete = (req, res, next) => {
    console.log("updateDescendantsAfterDelete")
    res.locals.descendants.forEach(descendant => {
      itemsCol.update({_id: descendant._id}, {$inc: {indentLevel: -1}})
    })
    itemsCol.updateMany({ $and: [{parent: res.locals.item._id.toString()}, {list: res.locals.listRef}]}, {$set: {parent: res.locals.item.parent}})
    next()
  }

  const incrementDescendantIndentLevels = (req, res, next) => {
    console.log("incrementDescendantIndentLevels")
    res.locals.descendants.forEach(descendant => {
      db.collection('items').update({_id: descendant._id}, {$inc: {indentLevel: 1}})
    })
    next()
  }

  const decrementDescendantIndentLevels = (req, res, next) => {
    console.log("decrementDescendantIndentLevels")
    res.locals.descendants.forEach(descendant => {
      db.collection('items').update({_id: descendant._id}, {$inc: {indentLevel: -1}})
    })
    next()
  }

  const getNearestSiblingAbove = (req, res, next) => {
    console.log("getNearestSiblingAbove")
    console.log(res.locals.item)
    itemsCol.find({$and: [{parent: res.locals.item.parent}, {orderNumber: {$lt: res.locals.orderNumber}}, {list: res.locals.listRef}]}).sort({orderNumber: -1}).limit(1).next().then(sibling => {
      console.log(sibling)
      res.locals.nearestSiblingAbove = sibling
      console.log(res.locals.nearestSiblingAbove)
      next()
    })
  }

  const getQueryDetailsForItem = (req, res, next) => {
    console.log("getQueryDetailsForItem")
    res.locals.details = {$and: [{orderNumber: res.locals.orderNumber}, {list: res.locals.listRef}]}
    next()
  }

  const getParentItem = (req, res, next) => {
    console.log("getParentItem")
    itemsCol.findOne({_id: new ObjectID(res.locals.item.parent)}).then((item) => {
      res.locals.parentItem = item
      next()
    })
  }

  const getChildrenItems = (req, res, next) => {
    console.log("getChildrenItems")
    db.collection('items').find({ $and: [ {indentLevel: {$gt: res.locals.item.indentLevel}}, {orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef} ]}).sort({orderNumber: 1}).toArray().then(children => {
      res.locals.childrenItems = children
      next()
    })
  }

  const selectPreviousItemAfterDelete = (req, res, next) => {
    if(res.locals.orderNumber == 0) res.locals.nextSelectedIndex = 0
    else res.locals.nextSelectedIndex = res.locals.orderNumber - 1
    console.log(res.locals.nextSelectedIndex)
    listsCol.update({selected: true}, {$set: {selectedItemIndex: res.locals.nextSelectedIndex}}).then(() => {
      next()
    })
  }

  const selectItem = (req, res, next) => {
    console.log("selectItem")
    listsCol.update({selected: true}, {$set: {selectedItemIndex: res.locals.orderNumber}}).then((result) => {
      res.locals.result = result
      next()
    })
  }

  //
  const removeItem = (req, res, next, [getItemByListAndOrderNumber, removeItemByOrderNumber, decrementOrderNumbers, getDescendantsOfItem, updateDescendantsAfterDelete, selectPreviousItemAfterDelete]) => {
    console.log("removeItem")
    getItemByListAndOrderNumber(req, res, next)
    .then(() => {
      return removeItemByOrderNumber(req, res, next)
    })
    .then(() => {
      return decrementOrderNumbers(req, res, next)
    })
    .then(() => {
      return getDescendantsOfItem(req, res, next)
    })
    .then(() => {
      return updateDescendantsAfterDelete(req, res, next)
    })
    .then(() => {
      return selectPreviousItemAfterDelete(req, res, next)
    })
    .then(() => {
      next()
    })
  }

























  //LISTS

  app.get('/lists/', (req, res) => {
    db.collection('lists').find({ $query: {}, $orderby: { orderNumber : 1 } }).toArray((err, lists) => {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        res.send(lists); 
      }
    });
  });

  app.get('/lists/selected', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        const result = { index: list.orderNumber  }
        res.send(result)
      })
  })

  app.post('/lists/', [parseOrderNumberFromFrontEnd], (req, res, next) => {
    listsCol.updateMany({orderNumber: {$gt: res.locals.orderNumber}}, { $inc: {orderNumber: 1}})
    .then(() => {
      return listsCol.insert({listTitle: '', orderNumber: res.locals.orderNumber+1, selected: false, selectedItemIndex: 0})
    })
    .then(() => {
      return listsCol.findOne({orderNumber: res.locals.orderNumber+1})
    })
    .then(newList => {
      return itemsCol.insert({itemTitle: '', orderNumber: 0, parent: null, indentLevel: 0, list: newList._id.toString()})
    })
    .then(result => {
      res.send(result)
    })
  })

  app.put('/lists/', [parseOrderNumberFromFrontEnd, getTitleFromFrontEnd], (req, res, next) => {
    db.collection('lists').update({orderNumber: res.locals.orderNumber}, {$set: {listTitle: res.locals.title}}).then((result) => {
      res.send(result)
    });
  });

  app.put('/lists/selected', [parseOrderNumberFromFrontEnd], (req, res, next) => {
    const prevSelectedList = { selected: true }
    const nextSelectedList = { orderNumber: res.locals.orderNumber};
    console.log(prevSelectedList)
    console.log(nextSelectedList)
    db.collection('lists').update(prevSelectedList, { $set: {selected: false}})
    .then(() => {
      console.log(nextSelectedList)
      return db.collection('lists').update(nextSelectedList, { $set: {selected: true}})
    })
    .then(() => {
      res.send("new list selected")
    })
  })

  app.delete('/lists/', [parseOrderNumberFromFrontEnd], (req, res, next) => {
    listsCol.findOne({orderNumber: res.locals.orderNumber})
    .then(list => {
      return itemsCol.deleteMany({list: list._id.toString()})
    })
    .then(() => {
      return listsCol.remove({orderNumber: res.locals.orderNumber})
    })
    .then(() => {
      return listsCol.update({orderNumber: {$gt: res.locals.orderNumber}}, {$inc: {orderNumber : -1}})
    })
    .then(result => {
      res.send(result)
    })
  })
















//ITEMS



  app.get('/items/', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        db.collection('items').find({ $query: {list: list._id.toString()}, $orderby: { orderNumber : 1 } }).toArray((err, items) => {
          if (err) res.send({'error':'An error has occurred'});
          else res.send(items); 
        });
      })
  });

  app.get('/items/selected/', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        const result = {index: list.selectedItemIndex}
        res.send(result)
      })
  })




  app.post('/items/', [getList], (req, res, next) => {
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    res.locals.nextItemOrderNumber = res.locals.orderNumber + 1
    next()
  }, [getItemByListAndOrderNumber, getNextItemByListAndOrderNumber], (req, res, next) => {
    if(res.locals.nextItem == null) {
      res.locals.parentRef = res.locals.item.parent
      res.locals.indentLevel = res.locals.item.indentLevel
    }
    else {
      if(res.locals.nextItem.parent == res.locals.item._id.toString()) {
        res.locals.parentRef = res.locals.item._id.toString()
        res.locals.indentLevel = res.locals.item.indentLevel + 1
      }
      else {
        res.locals.parentRef = res.locals.item.parent
        res.locals.indentLevel = res.locals.item.indentLevel
      }
    }
    res.locals.newItemProps = { itemTitle: '', orderNumber: res.locals.nextItemOrderNumber, parent: res.locals.parentRef, indentLevel: res.locals.indentLevel, list: res.locals.listRef, hidden: false}
    next()
  }, [incrementOrderNumbers, insertAfterOrderNumbersAdjustment, updateSelectedItemIndex], (req, res, next) => {
    res.send(res.locals.createdItem.ops[0])
  })


  app.put('/items/', [getList, parseOrderNumberFromFrontEnd, getTitleFromFrontEnd], (req, res, next) => {
    db.collection('items').update({$and: [{orderNumber: res.locals.orderNumber}, {list: res.locals.listRef}]}, { $set: {itemTitle: res.locals.title} }).then(result => {
      res.send(result)
    })
  })


  app.put('/items/selected/', [parseOrderNumberFromFrontEnd, selectItem], (req, res, next) => {
    res.send(res.locals.result)
  });


  app.put('/items/check/', [parseOrderNumberFromFrontEnd, getList], (req, res, next) => {
    res.locals.checked = JSON.parse(req.body.checked)
    db.collection('items').update({$and: [{orderNumber: res.locals.orderNumber}, {list: res.locals.listRef}]}, {$set: {checked: res.locals.checked}})
    .then(result => {
      res.send(result)
    })
  })


  app.put('/items/tab', [getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber, getQueryDetailsForItem, getNearestSiblingAbove], (req, res, next) => {
    console.log("tab")
    console.log(res.locals.details)
    console.log(res.locals.nearestSiblingAbove)
    itemsCol.update(res.locals.details, {$set: {parent: res.locals.nearestSiblingAbove._id.toString()}, $inc: {indentLevel: 1}}).then(() => {
      next()
    })
  }, [getDescendantsOfItem, incrementDescendantIndentLevels], (req, res, next) => {
    console.log("finished")
    res.send("item tabbed")
  })


  app.put('/items/untab', [getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber], (req, res, next) => {
    const siblingsToChildrenProps = {$and: [ {parent: {$eq: res.locals.item.parent}}, {orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef} ]}
    db.collection('items').updateMany(siblingsToChildrenProps, {$set: {parent: res.locals.item._id}})
    next()
  }, [getQueryDetailsForItem, getParentItem], (req, res, next) => {
    let parentToSet
    if(res.locals.parentItem == null) {
      parentToSet = null
    }
    else {
      parentToSet = res.locals.parentItem.parent
    }
    itemsCol.update(res.locals.details, { $set: {parent: parentToSet}, $inc:{indentLevel: -1}})
    next()
  }, [getChildrenItems], (req, res, next) => {
    for(let i = 0; i < res.locals.childrenItems.length; i++) {
      if(res.locals.childrenItems[i].orderNumber == res.locals.orderNumber + 1 + i) {
        db.collection('items').update({$and: [{orderNumber: res.locals.orderNumber + 1 + i}, {list: res.locals.listRef}]}, { $inc:{indentLevel: -1} })
      }
      else break
    }
    res.send("item untabbed")
  })


  app.delete('/items/', [getList], (req, res, next) => {
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    next()
  }, [getItemByListAndOrderNumber, removeItemByOrderNumber, decrementOrderNumbers, getDescendantsOfItem, updateDescendantsAfterDelete, selectPreviousItemAfterDelete], (req, res, next) => {
    res.send("item deleted")
  })




  

  


  //************************************************************************************************************************************
  //890

  /*
  app.delete('/items/trash/',[getList], (req, res, next) => {
    itemsCol.find({$and: [{checked: true}, {list: res.locals.listRef}]}).sort({orderNumber: 1}).toArray()
    .then(itemsToRemove => {
      console.log("items to remove: ")
      console.log(itemsToRemove)
      res.locals.incValue = itemsToRemove[0].orderNumber
      itemsToRemove.forEach(item => {
        res.locals.item = item
        res.locals.orderNumber = item.orderNumber
        getDescendantsOfItem(req, res, next)
        decrementDescendantIndentLevels(req, res, next)
        itemsCol.updateMany({ $and: [{parent: item._id.toString()}, {list: res.locals.listRef}]}, {$set: {parent: item.parent}})
        .then(() => {
          console.log("remove occurring")
          return itemsCol.remove({_id: item._id})
        })
      })
      return
    })
    .then(() => {
        return itemsCol.find({$and: [{orderNumber: {$gt: res.locals.incValue}}, {list: res.locals.listRef}]}).sort({orderNumber: 1}).toArray()
    })
    .then(itemsToShiftDown => {
      console.log("here")
      console.log(itemsToShiftDown)
      for(let i = 0; i < itemsToShiftDown.length; i++) {
        itemsCol.update({_id: itemsToShiftDown[i]._id}, {$set: {orderNumber: i + res.locals.incValue}})
      }
      return listsCol.update({selected: true}, {$set: {selectedItemIndex: 0}})
    })
    .then(result => {
      res.send(result)
    })
  })
  */

/*

app.put('/items/collapse/', [parseOrderNumberFromFrontEnd, getList], (req, res, next) => { 
  res.locals.decollapsed = JSON.parse(req.body.decollapsed)
  res.locals.remainDecollapsed = []
  res.locals.remainHidden = false
  res.locals.descendantOrderNumbers = []

  itemsCol.findOneAndUpdate({$and: [{orderNumber: res.locals.orderNumber}, {list: res.locals.listRef}]}, {$set: {decollapsed: !res.locals.decollapsed}})
  .then((item) => {
    res.locals.indentLevel = item.indentLevel
  }, [getDescendantsOfItem], (req, res, next) => {
    res.locals.descendants.forEach(descendant => {
      if(descendant.decollapsed) res.locals.remainDecollapsed.push(descendant)
      for(let i = 0; i < remainDecollapsed.length; i++) {
        if(descendant.parent == remainDecollapsed[i]._id.toString()) {
          remainHidden = true
          break
        }
      }
      if(!remainHidden) {
        res.locals.descendantOrderNumbers.push(descendant.orderNumber)
        itemsCol.update({_id: descendant._id}, {$set: {hidden: !res.locals.decollapsed}})
        .then(() => {
          return
        })
      }
    })
    res.send({index: res.locals.descendantOrderNumbers})
    
  })
})

*/



















  //const liftDescendantIndentLevelsAndRemoveItem = (req, res, next) => {
  const liftDescendantIndentLevelsAndRemoveItem = (id, on, parent, il, listRef) => {
    console.log("here???")
    //const on = req.onOfItemToBeRemoved //from .findOne()
    //const listRef = req.listRef

    let descendants = []

    db.collection('items').find( {$and: [{orderNumber: {$gt: on}}, {list: listRef}]} ).sort({orderNumber: 1}).toArray()
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
          db.collection('items').update({_id: descendant._id}, {$inc: {indentLevel: -1}})
        })
        db.collection('items').updateMany({ $and: [{parent: id.toString()}, {list: listRef}]}, {$set: {parent: parent}})
        return
      })
  }

  


  



  //not done yet

  
  app.delete('/items/trash/', (req, res) => {

    let listID, itemIndentLevel, incValue//, selectedItemIndex

    db.collection('lists').findOne({selected: true})
      .then((list) => {
        //selectedItemIndex = list.selectedItemIndex
        listID = list._id.toString()
        return db.collection('items').find({$and: [{checked: true}, {list: listID}]}).sort({orderNumber: 1}).toArray()
      })
      .then((itemsToRemove) => {
        incValue = itemsToRemove[0].orderNumber
        for(let i = 0; i < itemsToRemove.length; i++) {
          liftDescendantIndentLevelsAndRemoveItem(itemsToRemove[i]._id, itemsToRemove[i].orderNumber, itemsToRemove[i].parent, itemsToRemove[i].indentLevel, listID)
          db.collection('items').remove({_id: itemsToRemove[i]._id})
        }
        return
      })
      .then(() => {
        return db.collection('items').find({$and: [{orderNumber: {$gt: incValue}}, {list: listID}]}).sort({orderNumber: 1}).toArray()
      })
      .then((itemsToShiftDown) => {
        console.log(itemsToShiftDown)
        for(let i = 0; i < itemsToShiftDown.length; i++) {
          db.collection('items').update({_id: itemsToShiftDown[i]._id}, {$set: {orderNumber: i + incValue}})
        }
        return db.collection('lists').update({selected: true}, {$set: {selectedItemIndex: 0}})
      })
      .then((result) => {
        res.send(result)
      })

  })
  

  app.put('/items/collapse/', (req, res) => {

    const on = parseInt(req.body.orderNumber)
    const dclpsd = JSON.parse(req.body.decollapsed)
    let listID, iL, descendantOrderNumbers = [], dclpsdToRemain = [], stayHidden = false

    db.collection('lists').findOne({selected: true})
      .then((list) => {
        listID = list._id.toString()
        return db.collection('items').findOneAndUpdate({$and: [{orderNumber: on}, {list: listID}]}, {$set: {decollapsed: !dclpsd}})
      })
      .then((item) => {
        iL = item.value.indentLevel
        return db.collection('items').find( {$and: [{orderNumber: {$gt: on}}, {list: listID}]} ).sort({orderNumber: 1}).toArray()
      })
      .then((possibleDescendants) => {
        for(let i = 0; i < possibleDescendants.length; i++) {
          if(possibleDescendants[i].indentLevel > iL) { 
            if(possibleDescendants[i].decollapsed) dclpsdToRemain.push(possibleDescendants[i]._id.toString())
            for(let j = 0; j < dclpsdToRemain.length; j++) {
              if(possibleDescendants[i].parent == dclpsdToRemain[j]) {
                stayHidden = true
                break
              }
            }

            if(!stayHidden) {
              descendantOrderNumbers.push(possibleDescendants[i].orderNumber)
              db.collection('items').update({_id: possibleDescendants[i]._id}, {$set: {hidden: !dclpsd}})
            }
          }
          else {
            break
          }
        }
      })
      .then(() => {
        const result = {index: descendantOrderNumbers}
        res.send(result)
      })
  })




}
