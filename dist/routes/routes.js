var ObjectID = require('mongodb').ObjectID;



module.exports = function(app, db) {
  
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
      res.locals.item = item
      console.log(item)
      console.log(res.locals.item)
      next()
    })
  }

  const getNextItemByListAndOrderNumber = (req, res, next) => {
    console.log("getNextItemByListAndOrderNumber")
    itemsCol.findOne({list: res.locals.listRef, orderNumber: res.locals.nextItemOrderNumber}).then(item => {
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
    itemsCol.find( {$and: [{orderNumber: {$gte: res.locals.orderNumber}}, {list: res.locals.listRef}]} ).sort({orderNumber: 1}).toArray().then((possible) => {
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
    console.log("updateDescendantIndentLevels")
    res.locals.descendants.forEach(descendant => {
      db.collection('items').update({_id: descendant._id}, {$inc: {indentLevel: 1}})
    })
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
    return db.collection('items').findOne({_id: new ObjectID(res.locals.item.parent)}).then(() => {
      next()
    })
  }

  const getChildrenItems = (req, res, next) => {
    console.log("getChildrenItems")
    db.collection('items').find({ $and: [ {indentLevel: {$gt: res.locals.item.indentLevel}}, {orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef} ]}).sort({orderNumber: 1}).toArray().then(chilren => {
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





  app.get('/lists/selected', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        const result = { index: list.orderNumber  }
        res.send(result)
      })
  })

  app.get('/lists/', (req, res) => {
    db.collection('lists').find({ $query: {}, $orderby: { orderNumber : 1 } }).toArray((err, lists) => {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        res.send(lists); 
      }
    });
  });


  app.put('/lists/selected', [parseOrderNumberFromFrontEnd], (req, res, next) => {
    const prevSelectedList = { selected: true }
    const nextSelectedList = { orderNumber: res.locals.orderNumber };
    db.collection('lists').update(prevSelectedList, { $set: {selected: false}}).then(() => {
      return db.collection('lists').update(nextSelectedList, { $set: {selected: true}})
    }).then(() => {
      res.send("new list selected")
    })
  })

  app.put('/lists/', [parseOrderNumberFromFrontEnd, getTitleFromFrontEnd], (req, res, next) => {
    db.collection('lists').update({orderNumber: res.locals.orderNumber}, {$set: {listTitle: res.locals.title}}).then((result) => {
      res.send(result)
    });
  });

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

  
  app.delete('/lists/', [parseOrderNumberFromFrontEnd], (req, res, next) => {
    listsCol.findOne({orderNumber: res.locals.orderNumber})
    .then(list => {
      return itemsCol.deleteMany({list: list._id.toString()})
    })
    .then(() => {
      return listsCol.remove({orderNumber: res.locals.orderNumber})
    })
    .then(result => {
      res.send(result)
    })
  })





  app.get('/items/', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        db.collection('items').find({ $query: {list: list._id.toString()}, $orderby: { orderNumber : 1 } }).toArray((err, items) => {
          if (err) res.send({'error':'An error has occurred'});
          else res.send(items); 
        });
      })
  });

  app.get('/selecteditem/', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        const result = {index: list.selectedItemIndex}
        res.send(result)
      })
  })







  //using next()

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
    res.locals.newItemProps = { itemTitle: '', orderNumber: res.locals.nextItemOrderNumber, parent: res.locals.parentRef, indentLevel: res.locals.indentLevel, list: res.locals.listRef}
    next()
  }, [incrementOrderNumbers, insertAfterOrderNumbersAdjustment, updateSelectedItemIndex], (req, res, next) => {
    res.send(res.locals.createdItem.ops[0])
  })


  app.delete('/items/', [getList], (req, res, next) => {
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    next()
  }, [getItemByListAndOrderNumber, removeItemByOrderNumber, decrementOrderNumbers, getDescendantsOfItem, updateDescendantsAfterDelete, selectPreviousItemAfterDelete], (req, res, next) => {
    res.send("item deleted")
  })

  app.put('/items/', [getList, parseOrderNumberFromFrontEnd, getTitleFromFrontEnd], (req, res, next) => {
    db.collection('items').update({$and: [{orderNumber: res.locals.orderNumber}, {list: res.locals.listRef}]}, { $set: {itemTitle: res.locals.title} }).then(result => {
      res.send(result)
    })
  })


  //************************************************************************************************************************************
  //890


  app.put('/items/tab', [getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber, getQueryDetailsForItem, getNearestSiblingAbove], (req, res, next) => {
    console.log("tab")
    console.log(res.locals.details)
    console.log(res.locals.nearestSiblingAbove)
    itemsCol.update(res.locals.details, {$set: {parent: res.locals.nearestSiblingAbove._id.toString()}, $inc: {indentLevel: 1}}).then(() => {
      next()
    })
  }, [getDescendantsOfItem, incrementDescendantIndentLevels], (req, res, next) => {
    res.send("item tabbed")
  })
  
  app.put('/items/untab', [getList, parseOrderNumberFromFrontEnd, getItemByListAndOrderNumber], (req, res, next) => {
    const siblingsToChildrenProps = {$and: [ {parent: {$eq: res.locals.item.parent}}, {orderNumber: {$gt: res.locals.orderNumber}}, {list: res.locals.listRef} ]}
    db.collection('items').updateMany(siblingsToChildrenProps, {$set: {parent: res.locals.item._id}})
  }, [getParentItem], (req, res, next) => {
    db.collection('items').update(details, { $set: {parent: parentItem.parent}, $inc:{indentLevel: -1}})
  }, [getChildrenItems], (req, res, next) => {
    for(let i = 0; i < res.locals.childrenItems.length; i++) {
      if(res.locals.childrenItems[i].orderNumber == res.locals.orderNumber + 1 + i) {
        db.collection('items').update({$and: [{orderNumber: res.locals.orderNumber + 1 + i}, {list: res.locals.listRef}]}, { $inc:{indentLevel: -1} })
      }
      else break
    }
  })


  //rename items/selected
  app.put('/selectitem/', [parseOrderNumberFromFrontEnd], (req, res, next) => {
    db.collection('lists').update({selected: true}, {$set: {selectedItemIndex: res.locals.orderNumber}})
      .then((result) => {
        res.send(result)
      })
  });


  app.put('/items/check/', [parseOrderNumberFromFrontEnd, getList], (req, res, next) => {
    res.locals.checked = JSON.parse(req.body.checked)
    db.collection('items').update({$and: [{orderNumber: on}, {list: res.locals.listRef}]}, {$set: {checked: checked}})
    .then(result => {
      res.send(result)
    })
  })

  app.delete('/items/trash/',[getList], (req, res, next) => {
    itemsCol.find({$and: [{checked: true}, {list: res.locals.listRef}]}).sort({orderNumber: 1}).toArray()
    .then(itemsToRemove => {
      res.locals.incValue = itemsToRemove[0].orderNumber
      itemsToRemove.forEach(item => {
        res.locals.orderNumber = item.orderNumber
        getDescendantsOfItem(req, res, next)
        incrementDescendantIndentLevels(req, res, next)
        itemsCol.updateMany({ $and: [{parent: item._id.toString()}, {list: res.locals.listRef}]}, {$set: {parent: item.parent}})
        .then(() => {
          return itemsCol.remove({_id: item._id})
        })
      })
      itemsCol.find({$and: [{orderNumber: {$gt: res.locals.incValue}}, {list: res.locals.listRef}]}).sort({orderNumber: 1}).toArray()
      .then(itemsToShiftDown => {
        for(let i = 0; i < itemsToShiftDown.length; i++) {
          itemsCol.update({_id: itemsToShiftDown[i]._id}, {$set: {orderNumber: i + res.locals.incValue}})
        }
        return listsCol.update({selected: true}, {$set: {selectedItemIndex: 0}})
      })
    })
    .then(result => {
      res.send(result)
    })
  })


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


  const createOrderNumberIndex = function(db, callback) {
      const collection = db.collection('items');
      collection.ensureIndex(
        { orderNumber : 1 }, function(err, result) {
        callback(result);
      });
    };

  //const collection = 

  //***
  app.get('/lists/', (req, res) => {
    db.collection('lists').find({ $query: {}, $orderby: { orderNumber : 1 } }).toArray((err, lists) => {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        res.send(lists); 
      }
    });
  });

  //***
  app.get('/items/', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        db.collection('items').find({ $query: {list: list._id.toString()}, $orderby: { orderNumber : 1 } }).toArray((err, items) => {
          if (err) res.send({'error':'An error has occurred'});
          else res.send(items); 
        });
      })
  });

  //***
  app.get('/selecteditem/', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        const result = {index: list.selectedItemIndex}
        res.send(result)
      })
  })

  //****
  app.get('/lists/selected', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        const result = {index: list.orderNumber  }
        res.send(result)
      })
  })


  /*
  app.put('/items/', (req, res) => {
    const on = Number(req.body.orderNumber);
    const it = req.body.title
    const details = { orderNumber: on };
    const title = {itemTitle: it}
    const itemProp = { $set: title }

    
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        return db.collection('items').update({$and: [{orderNumber: on}, {list: list._id.toString()}]}, itemProp)
      })
      .then((result) => {
        res.send(result)
      })
  
  });
  */


    /*
    db.collection('items').update(details, itemProp, (err, result) => {
      if (err) {
          res.send({'error':'An error has occurred'});
      } else {
          res.send(result);
      } 
    });
    */
    

  //if the item isn't ON #0
  //if the item has a sibling above

  //increment indent levels at the end

/*
  tab:
• order doesn't change
• if ((item @ on - 1).indentLevel >= (item @ on).indentLevel && on != 0) you can tab (this should be completely frontend so remove later)
• find closest sibling above -> equal to (item@on).parent, greatest orderNumber less than on
• (item@on).parent = (closestSiblingAbove)._id
• (item@on).indentLevel ++
• (all of (item@on)'s descendents).indentLevel++
*/

  //****
  /*
  app.put('/items/tab', (req, res) => {
    const on = Number(req.body.ordernumber);
    let listID, details, parentID, itemIndentLevel
    let descendants = []

    db.collection('lists').findOne({selected: true})
      .then((list) => {
        listID = list._id.toString()
        details = {$and: [{orderNumber: on}, {list: listID}]}
        return db.collection('items').findOne(details)
      })
      .then((item) => {
        parentID = item.parent
        itemIndentLevel = item.indentLevel
        return db.collection('items').find({$and: [{parent: parentID}, {orderNumber: {$lt: on}}, {list: listID}]}).sort({orderNumber: -1}).limit(1).next()
        //return db.collection('items').find({$query: {$and: [{parent: parentID}, {orderNumber: {$lt: on}}, {list: listID}]}, $orderby: {orderNumber: 1}})
      })
      .then((closestSiblingAbove) => {
        return db.collection('items').update(details, {$set: {parent: closestSiblingAbove._id.toString()}})
      })
      .then(() => {
        return db.collection('items').update(details, {$inc: {indentLevel: 1}})
      })
      .then(() => {
        return db.collection('items').find({$and: [{orderNumber: {$gt: on}}, {list: listID}]} ).sort({orderNumber: 1}).toArray()
      })
      .then((possibleDescendants) => {
        for(let i = 0; i < possibleDescendants.length; i++) {
          if(possibleDescendants[i].indentLevel > itemIndentLevel) { 
            descendants.push(possibleDescendants[i]) 
          }
          else {
            break
          }
        }
        descendants.forEach((descendant) => {
          db.collection('items').update({_id: descendant._id}, {$inc: {indentLevel: 1}})
        })
        return
      })
      .then((result) => {
        //this is not an actual .update(...) result, a blank result variable needs 
        //to be sent to react in order for the fetch().then statement to perform
        res.send(result)
      })
  })

  */

  //PUT IN FRONTEND if(indentLevel != 0)
  //****
  app.put('/items/untab', (req, res) => {
    const on = Number(req.body.ordernumber)
    let listID, details, itemIndentLevel

    db.collection('lists').findOne({selected: true})
      .then((list) => {
        listID = list._id.toString()
        details = {$and: [{orderNumber: on}, {list: listID}]}
        return db.collection('items').findOne(details)
      })
      .then((item) => {
        itemIndentLevel = item.indentLevel
        const siblingsToChildrenProps = {$and: [ {parent: {$eq: item.parent}}, {orderNumber: {$gt: on}}, {list: listID} ]}
        db.collection('items').updateMany(siblingsToChildrenProps, {$set: {parent: item._id}})
        return db.collection('items').findOne({_id: new ObjectID(item.parent)})
      })
      .then((parentItem) => {
        db.collection('items').update(details, { $set: {parent: parentItem.parent}})
        db.collection('items').update(details, { $inc:{indentLevel: -1} })
        return db.collection('items').find({ $and: [ {indentLevel: {$gt: itemIndentLevel}}, {orderNumber: {$gt: on}}, {list: listID} ]}).sort({orderNumber: 1}).toArray()
      })
      .then((children) => {
        for(let i = 0; i < children.length; i++) {
          if(children[i].orderNumber == on + 1 + i) {
            db.collection('items').update({$and: [{orderNumber: on + 1 + i}, {list: listID}]}, { $inc:{indentLevel: -1} })
          }
          else break
        }
        return
      })
      .then((result) => {
        res.send(result)
      })

  })

  /*
  app.put('/items/untab', (req, res) => {
    var on = Number(req.body.ordernumber);
    var details = { orderNumber: on };
    var ancestorsArray = []

    db.collection('items').findOne(details)
      .then((item) => {
        if(item.parent != null) {
          db.collection('items').find({ $and: [ {parent: {$eq: item.parent}}, {orderNumber: {$gt: on}} ]}).toArray()
            .then((siblings) => {
              for(var i = 0; i < siblings.length; i++) {
                db.collection('items').update({ '_id': new ObjectID(siblings[i]._id) }, { $set: {parent: item._id}})
              }
              const parentDetails = { '_id': new ObjectID(item.parent) };
              db.collection('items').findOne(parentDetails, (err, parentItem) => {
                db.collection('items').update(details, { $set: {parent: parentItem.parent}}, (err, result) => {
                  if(err) res.send({'error':'An error has occurred'})
                  else {
                    db.collection('items').update(details, { $inc:{indentLevel: -1} }, (err, result) => {
                      if(err) res.send({'error':'An error has occurred'})
                      else res.send(result)
                    })
                    db.collection('items').find({ $and: [ {indentLevel: {$gt: item.indentLevel}}, {orderNumber: {$gt: on}} ]}).sort({orderNumber: 1}).toArray()
                      .then((childrenArray) => {
                        for(var i = 0; i < childrenArray.length; i++) {
                          if(childrenArray[i].orderNumber == on + 1 + i) {
                            db.collection('items').update({orderNumber: on + 1 + i}, { $inc:{indentLevel: -1} })
                          }
                          else break
                        }
                      
                      
                      })
                    }
                })
              })
            })
        }
      })
  })
  */
  //***
  app.put('/lists/selected', (req, res) => {
    var on = Number(req.body.orderNumber);
    var prevSelectedList = {selected: true}
    var nextSelectedList = { orderNumber: on };
    db.collection('lists').update(prevSelectedList, { $set: {selected: false}})
      .then((unselected) => {
        return db.collection('lists').update(nextSelectedList, { $set: {selected: true}})
      })
      .then((result) => {
        res.send(result)
      })
  })

  //***
  app.put('/lists/', (req, res) => {
    const on = Number(req.body.ordernumber);
    const lt = req.body.listtitle
    const details = { orderNumber: on };
    const title = {listTitle: lt}
    const listProp = { $set: title }

    db.collection('lists').update(details, listProp, (err, result) => {
      if (err) {
          res.send({'error':'An error has occurred'});
      } else {
          res.send(result);
      } 
    });
  });

  /*

  app.delete('/lists/', (req, res) => {
    //id instead of ordernumber
    //const id = req.params.id;
    //const details = { '_id': new ObjectID(id) };

    const on = parseInt(req.body.orderNumber)
    const details = { orderNumber: on }

    var createOrderNumberIndex = function(db, callback) {
      var collection = db.collection('lists');
      // Create the index
      collection.createIndex(
        { orderNumber : 1 }, function(err, result) {
        callback(result);
      });
    };

    //find id before deleting, eliminate if using id instead
    var id = db.collection('lists').findOne(details, (err, item) => {
      if(err) {
        res.send({'error':'An error has occurred'});
      } else {
        id = item._id
        db.collection('lists').remove(details, (err, item) => {
        if (err) {
          res.send({'error':'An error has occurred'});
        } else {
          db.collection('lists').count()
            .then((count) => {
              for(var i = on; i < count; i++) {
                db.collection('lists').update({orderNumber: i+1}, { $set: {orderNumber: i}})
              }
            })
          res.send(id);
        }});
      }
    })
  });
  */


  app.post('/lists/', (req, res) => {


    const on = parseInt(req.body.orderNumber)

    db.collection('lists').updateMany({orderNumber: {$gt: on}}, { $inc: {orderNumber: 1}})
      .then((updated) => { 
        return db.collection('lists').insert({listTitle: '', orderNumber: on+1, selected: false, selectedItemIndex: 0})
      })
      .then((listCreated) => {
        return db.collection('lists').findOne({orderNumber: on+1}) 
      })
      .then((newList) => {
        return db.collection('items').insert({itemTitle: '', orderNumber: 0, parent: null, indentLevel: 0, list: newList._id.toString()})
      })
      .then((itemCreated) => {
        return res.send(itemCreated)
      })
  })  


  app.delete('/lists/', (req, res) => {
    //id instead of ordernumber
    //const id = req.params.id;
    //const details = { '_id': new ObjectID(id) };
    const on = parseInt(req.body.orderNumber)

    db.collection('lists').findOne({orderNumber: on})
      .then((listToDelete) => {
        return db.collection('items').deleteMany({list: listToDelete._id.toString()})
      })
      .then(() => {
        return db.collection('lists').remove({orderNumber: on})
      }) 
      .then((result) => {
        res.send(result)
      })
  })

  app.put('/selectitem/', (req, res) => {
    const on = Number(req.body.orderNumber);
    db.collection('lists').update({selected: true}, {$set: {selectedItemIndex: on}})
      .then((result) => {
        res.send(result)
      })
  });

  app.put('/items/check/', (req, res) => {
    const on = parseInt(req.body.orderNumber)
    const chkd = JSON.parse(req.body.checked)
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        return db.collection('items').update({$and: [{orderNumber: on}, {list: list._id.toString()}]}, {$set: {checked: chkd}})
      })
      .then((result) => {
        res.send(result)
      })

  })

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


/*
    var createOrderNumberIndex = function(db, callback) {
      var collection = db.collection('items');
      // Create the index
      collection.createIndex(
        { orderNumber : 1 }, function(err, result) {
        callback(result);
      });
    };
*/
