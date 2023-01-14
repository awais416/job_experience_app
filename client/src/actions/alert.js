import { SET_ALERT, REMOVE_ALERT } from './types'
import { v4 as uuiv4d } from 'uuid'
export const setAlert =
  (msg, alertType, timeout = 5000) =>
  (dispatch) => {
    const id = uuiv4d()
    dispatch({ type: SET_ALERT, payload: { msg, alertType, id } })

    setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout)
  }
