import React from 'react';
import ReactDOM from 'react-dom';

import AllistItem from './Allistitem';

import { DragLayer } from "react-dnd";
import { ItemTypes } from "./Constants";

const layerStyles = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 100,
  left: 0,
  top: -25,
  width: "100%",
  height: "100%"
};

function getItemStyles(props) {
  const { initialOffset, currentOffset } = props;
  if (!initialOffset || !currentOffset) {
    return {
      display: "none"
    };
  }
  let { x, y } = currentOffset;
  let xx = x - 400, yy = y - 400
  
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform
  };
}

const DefaultDragLayer = props => {
  const { item, itemType, isDragging, width, data } = props;
  function renderItem() {
    switch (itemType) {
      case ItemTypes.ITEM:
        console.log(item)
        return (
          <AllistItem
            style={{outline: '0'}}
            width={width}
            primaryKey = {item.properties.primaryKey}
            itemTitle={item.properties.itemTitle} 
            orderNumber = {item.properties.orderNumber} 
            indentLevel = {item.properties.indentLevel}
            selected = {true}
            checked={item.properties.checked}
            hidden={false}
            decollapsed={item.properties.decollapsed}>
          </AllistItem>
        );
      default:
        return null;
    }
  }

  if (!isDragging) {
    return null;
  }

  return <div style={layerStyles}><div style={getItemStyles(props)}>{renderItem()}</div></div>;
};

export default DragLayer(monitor => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  initialOffset: monitor.getInitialClientOffset(),
  currentOffset: monitor.getClientOffset(),
  isDragging: monitor.isDragging()
}))(DefaultDragLayer);
