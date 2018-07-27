var ObjectID = require('mongodb').ObjectID;

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

module.exports = function(app, db) {

  const listsCol = db.collection('lists')
  const itemsCol = db.collection('items')

  //const liftDescendantIndentLevelsAndRemoveItem = (req, res, next) => {
  const liftDescendantIndentLevelsAndRemoveItem = (id, on, parent, il, listRef) => {
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

  const collection = 

  app.get('/lists/', (req, res) => {
    db.collection('lists').find({ $query: {}, $orderby: { orderNumber : 1 } }).toArray((err, lists) => {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        res.send(lists); 
      }
    });
  });

  app.get('/fetchitems/', (req, res) => {
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

  app.get('/selectedlist/', (req, res) => {
    db.collection('lists').findOne({selected: true})
      .then((list) => {
        const result = {index: list.orderNumber  }
        res.send(result)
      })
  })

  
  app.post('/items/', (req, res) => {

    var createItemIndex = function(db, callback) {
      var collection = db.collection('items');
      // Create the index
      collection.createIndex(
        { orderNumber : 1 }, function(err, result) {
        callback(result);
      });

      collection.createIndex(
        {list: 1}, function(err, result) {
          callback(result)
        })
      collection.createIndex(
        {orderNumber: 1, list: 1}, function(err, result) {
          callback(result)
        })

    };

    var createListIndex = function(db, callback) {
      var collection = db.collection('lists')
      collection.createIndex(
        {selected: 1}, function(err, result) {
          callback(result)
        })
    }

    const on = parseInt(req.body.orderNumberEntered)
    let newItemProps, parentID, iL, listID

    db.collection('lists').findOne({selected: true}).then((list) => {
      listID = list._id.toString()
      db.collection('items').count({list: listID}).then((count)=> {
        db.collection('items').findOne({$and: [{orderNumber: on}, {list: listID}]}).then((item)=> {
          if(on == count - 1) {
            parentID = item.parent
            iL = item.indentLevel
            newItemProps = { itemTitle: '', orderNumber: on+1, parent: parentID, indentLevel: iL, list: listID}
            db.collection('items').updateMany({$and: [{orderNumber: {$gt: on}}, {list: list._id.toString()}]}, { $inc: {orderNumber: 1}}).then((updated) => {
              db.collection('items').insert(newItemProps, (err, result) => {
                if (err) res.send({ 'error': 'An error has occurred' })
                else res.send(result.ops[0]);
              });
            })
          }
          else {
            db.collection('items').findOne({$and: [{orderNumber: on+1}, {list: listID}]}).then((prevNextItem) => {
              if(prevNextItem.parent == item._id.toString()) {
                parentID = item._id.toString()
                iL = item.indentLevel + 1
              }
              else {
                parentID = item.parent
                iL = item.indentLevel
              }
              newItemProps = { itemTitle: '', orderNumber: on+1, parent: parentID, indentLevel: iL, list: listID}
              db.collection('items').updateMany({$and: [{orderNumber: {$gt: on}}, {list: list._id.toString()}]}, { $inc: {orderNumber: 1}}).then((updated) => {
                db.collection('items').insert(newItemProps, (err, newItem) => {
                  db.collection('lists').update({selected: true}, {$set: {selectedItemIndex: on+1}}, (err, result) => {
                    if (err) res.send({ 'error': 'An error has occurred' })
                    else res.send(newItem.ops[0]);
                  })
                });
              })
            })
          }
        })
      })
    })
  })
  

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


  app.put('/items/', (req, res) => {
    const on = Number(req.body.ordernumber);
    const it = req.body.itemtitle
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

  app.put('/selectlist', (req, res) => {
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
      .then((itemToDelete) => {
        return db.collection('items').deleteMany({list: itemToDelete._id.toString()})
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
    const clpsd = JSON.parse(req.body.collapsed)
    let listID

    db.collection('lists').findOne({selected: true})
      .then((list) => {
        listID = list._id.toString()
        return db.collection('items').update({$and: [{orderNumber: on}, {list: listID}]}, {$set: {collapsed: !clpsd}})
      })
      .then(()=> {
        return db.collection('items').find( {$and: [{orderNumber: {$gt: on}}, {list: listID}]} ).sort({orderNumber: 1}).toArray()
      })
      .then((possibleDescendants) => {
        for(let i = 0; i < possibleDescendants.length; i++) {
          if(possibleDescendants[i].indentLevel > il) { 
            db.collection('items').update({_id: possibleDescendants[i]._id}, {$set: {hidden: !clpsd}})
          }
          else {
            break
          }
        }
        descendants
      })

  })




}