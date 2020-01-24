const API = '/items/';

const assignFetchData = (action, paramData) => {
	const method = getMethod(action)
	return { method: method, body: JSON.stringify(paramData),
	    headers: new Headers({
	    	'authorization': 'Bearer ' + localStorage.getItem('access'),
	    	'content-type': 'application/json',
	    	'X-Requested-With': 'XMLHttpRequest',
	    })
	}
}

const getUrl = (action) => {
	switch (action) {
		case 'editItemTitle': {
			return API
		}
		case 'toggleCheckbox': {
			return `${API}check`
		}
		//example with break
		case 'delete': {
			if(this.state.items.length != 1) {
				this.deleteItem(orderNumber); 
			}
			break;
		}
	}
}

const getMethod = (action) => {
	switch (action) {
		case 'editItemTitle': {
			return 'PUT'
		}
		case 'toggleCheckbox': {
			return 'PUT'
		}
	}
}

export const callFetch = (action, paramData) => {
  const url = getUrl(action)
  const fetchData = assignFetchData(action, paramData)
  return fetch(url, fetchData).then((res) => res.json());
}