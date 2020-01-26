const API = '/items/';

const assignFetchData = (action, paramData) => {
	const method = getMethod(action)
	const fetchData = {
		headers: new Headers({
	    	'authorization': 'Bearer ' + localStorage.getItem('access'),
	    	'content-type': 'application/json',
	    	'X-Requested-With': 'XMLHttpRequest',
	    })
	}
	if(paramData) {
		fetchData.method = method
		fetchData.body = JSON.stringify(paramData)
	}
	return fetchData;
}

const getUrl = (action) => {
	switch (action) {
		case 'fetchInitialData': {
			return API
		}
		case 'createItem': {
			return API
		}
		case 'deleteItem': {
			return API
		}
		case 'editItemTitle': {
			return API
		}
		case 'toggleCheckbox': {
			return `${API}check`
		}
	}
}

const getMethod = (action) => {
	switch (action) {
		case 'createItem': {
			return 'POST'
		}
		case 'deleteItem': {
			return 'DELETE'
		}
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