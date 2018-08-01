var ObjectID = require('mongodb').ObjectID;



module.exports = function(app, db) {


  //
  
  
  const listsCol = db.collection('lists')
  const itemsCol = db.collection('items')


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
    db.collection('lists').update({orderNumber: res.locals.orderNumber}, {$set: {listTitle: res.locals.title}}.then((result) => {
      res.send(result)
    });
  });



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

  const parseOrderNumberFromFrontEnd = (req, res, next) => {
    console.log("parseOrderNumberFromFrontEnd")
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    next()
  }

  const getTitleFromFrontEnd = (req, res, next) => {
    console.log("parseOrderNumberFromFrontEnd")
    res.locals.title = req.body.title
  }

  const getList = (req, res, next) => {
    console.log("getList")
    listsCol.findOne({selected: true}).then(list => {
      res.locals.listRef = list._id.toString()
      next()
    })
  }

  //requires getList function
  const countItemsInList = (req, res, next) => {
    console.log("countItemsInList")
    itemsCol.count({list: res.locals.listRef}).then(count=> {
      res.locals.itemCount = count
      next()
    })
  }

  //requires getList and orderNumber param 
  const getItemByListAndOrderNumber = (req, res, next) => {
    console.log("getItemByListAndOrderNumber")
    itemsCol.findOne({list: res.locals.listRef, orderNumber: res.locals.orderNumber}).then(item => {
      res.locals.item = item
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
    console.log("removeItem")
    itemsCol.remove({$and: [{orderNumber: res.locals.orderNumber}, {list: res.locals.listRef}]})
  }


  const updateSelectedItemIndex = (req, res, next) => {
    console.log("updateSelectedItemIndex")
    itemsCol.update({selected: true}, {$set: {selectedItemIndex: res.locals.itemToCreateOrderNumber}}).then(() => {
      next()
    })
  }

  const getDescendantsOfItem = (req, res, next) => {
    console.log("getDescendantsOfItem")
    itemsCol.find( {$and: [{orderNumber: {$gte: on}}, {list: listID}]} ).sort({orderNumber: 1}).toArray().then((possible) => {
      for(let i = 0; i < possible.length; i++) {
        if(possible[i].indentLevel > il) { 
          descendants.push(possible[i]) 
        }
        else break
      }
      res.locals.descendants = descendants
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
    itemsCol.find({$and: [{parent: res.locals.item.parent}, {orderNumber: {$lt: res.locals.orderNumber}}, {list: res.locals.listRef}]}).sort({orderNumber: -1}).limit(1).next().then(sibling => {
      res.locals.nearestSiblingAbove = sibling
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
  }, [incrementOrderNumbers, insertAfterOrderNumbersAdjustment], (req, res, next) => {
    res.send(res.locals.createdItem.ops[0])
  })


  app.delete('/items/', [getList], (req, res, next) => {
    res.locals.orderNumber = parseInt(req.body.orderNumber)
    next()
  }, [getItemByListAndOrderNumber, removeItemByOrderNumber, decrementOrderNumbers, getDescendantsOfItem, updateDescendantsAfterDelete], (req, res, next) => {
    res.send("item deleted")
  })


  app.put('/items/', [getList, parseOrderNumberFromFrontEnd, getTitleFromFrontEnd], (req, res, next) => {
    db.collection('items').update({$and: [{orderNumber: res.locals.orderNumber}, {list: listRef}]}, { $set: res.locals.newTitle }).then(result => {
      res.send(result)
    })
  })

  app.put('/items/tab', [getList], (req, res, next) => {
    res.locals.orderNumber = parseInt(req.body.orderNumber)
  next()
  }, [getItemByListAndOrderNumber, getQueryDetailsForItem, getNearestSiblingAbove], (req, res, next) => {
    itemsCol.update(res.locals.details, {$set: {parent: res.locals.nearestSiblingAbove._id.toString()}, $inc: {indentLevel: 1}}).then(() => {
    next()
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

  
  //
  
  
  
  //***
  app.delete('/items/', (req, res) => {
    //id instead of ordernumber
    //const id = req.params.id;
    //const details = { '_id': new ObjectID(id) };
    const on = parseInt(req.body.orderNumber)
    let itemProps, listID, newSelectedItemIndex, itemIndentLevel, itemToDeleteId, itemToDeleteParent
    let descendants = []

    /*
    db.collection('lists').findOne({selected: true}).then((list) => {
      db.collection('items').findOne({$and: [{orderNumber: on}, {list._id.toString()}]}).then((itemToDelete) => {

      })
    })
    */


    db.collection('lists').findOne({selected: true})
      .then((list) => {
        listID = list._id.toString()
        itemProps = {$and: [{orderNumber: on}, {list: listID}]}
        return db.collection('items').findOne(itemProps)
      })
      .then((itemToDelete) => {
        itemIndentLevel = itemToDelete.indentLevel
        itemToDeleteId = itemToDelete._id.toString()
        itemToDeleteParent = itemToDelete.parent
        return db.collection('items').remove(itemProps)
      })
      .then((deletedItem) => {
        return db.collection('items').count({list: deletedItem.list})
      })
      .then((count) => {
        db.collection('items').updateMany({$and: [{orderNumber: {$gt: on}}, {list: listID}]}, { $inc: {orderNumber: -1}})
        return db.collection('items').find( {$and: [{orderNumber: {$gte: on}}, {list: listID}]} ).sort({orderNumber: 1}).toArray()
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
          db.collection('items').update({_id: descendant._id}, {$inc: {indentLevel: -1}})
        })
        db.collection('items').updateMany({ $and: [{parent: itemToDeleteId}, {list: listID}]}, {$set: {parent: itemToDeleteParent}})
        return
      })
      .then(() => {
        if(on == 0) newSelectedItemIndex = 0
        else newSelectedItemIndex = on - 1
        return db.collection('lists').update({selected: true}, {$set: {selectedItemIndex: newSelectedItemIndex}})
      })
      .then((result) => {
        return res.send('Item ' + result.id + ' deleted!');
      })

    /*
    var id = db.collection('items').findOne(itemProps, (err, item) => {
      if(err) {
        res.send({'error':'An error has occurred'});
      } else {
        id = item._id
        db.collection('items').remove(details, (err, item) => {
        if (err) {
          res.send({'error':'An error has occurred'});
        } else {
          db.collection('items').count({list: item.list})
            .then((count) => {
              for(var i = on; i < count; i++) {
                db.collection('items').update({orderNumber: i+1}, { $set: {orderNumber: i}})
              }
            })
          res.send('Item ' + id + ' deleted!');
        }});
      }
    })
    */

  });

  //***
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
    
    /*
    db.collection('items').update(details, itemProp, (err, result) => {
      if (err) {
          res.send({'error':'An error has occurred'});
      } else {
          res.send(result);
      } 
    });
    */
    
  });

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