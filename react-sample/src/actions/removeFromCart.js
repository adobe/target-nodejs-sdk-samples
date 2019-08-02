import store from '../store'
import axios from '../utils/mockAxios.js'
import {fetchCart} from './fetchCart'

const requestRemoveFromCart = () => {
  return {
    type: 'REQUEST_REMOVE_FROM_CART'
  };
};

const receiveRemoveFromCart = (data) => {
  return {
    type: 'RECEIVE_REMOVE_FROM_CART'
  };
};

export const removeFromCart = (key, target) => {
  return dispatch => {
    dispatch(requestRemoveFromCart());
    return axios.delete('cart', key)
      .then(response => response)
      .then(json => {
        dispatch(receiveRemoveFromCart(json.data));
        dispatch(fetchCart())
      });
  };
};
