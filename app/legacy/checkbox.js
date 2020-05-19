import React from 'react';
import ReactDOM from 'react-dom';
import styles from './css/checkbox.css';

const Checkbox = ({isHidingChildren, isChecked, click}) => {

  const handleClick = () => {
    click()
  };

  return (
    <div className={isHidingChildren ? (isChecked ? styles.divcollapsedcheckboxchecked : styles.divcollapsedcheckboxunchecked) : (isChecked ? styles.divcheckboxchecked : styles.divcheckboxunchecked)} 
		onClick={handleClick}>
	</div>
  );
}

export default Checkbox;
