import config from '@/config'

import * as types from './mutation-types'

import { signIn, signOut, getCurrentUser, db, auth } from '@/services/firebase'

const TOKEN_REFRESH_INTERVAL = 60 * 1000 * 10 // 10 minutes

/**
 * Trigger login
 */
export const login = async ({ commit, dispatch }) => {
  commit(types.AUTH_START)
  try {
    const response = await signIn()
    const user = response.user.toJSON()
    const {
      uid,
      email,
      displayName: name,
      photoURL: picture
    } = user
    dispatch('setUID', uid)
    dispatch('tryCreateUser', {
      uid,
      email,
      name,
      picture
    })
    commit(types.AUTH_SUCCESS, user)
    commit(types.AUTH_COMPLETE)
    dispatch('authTokenRefresh')
  } catch (err) {
    commit(types.AUTH_FAILED)
  }
}

/**
 * Force refresh the current auth token to ensure it doesn't expire
 */
export const authTokenRefresh = async ({ dispatch }) => {
  setTimeout(async () => {
    try {
      await auth().currentUser.getIdToken(true)
      dispatch('authTokenRefresh')
    } catch (err) {
      console.error(err)
    }
  }, TOKEN_REFRESH_INTERVAL)
}

/**
 *
 */
export const showNotification = async ({ commit, dispatch }, { message, type }) => {
  commit(types.ADD_NOTIFICATION, { message, type })
}

/**
 *
 */
export const removeNotification = async ({ commit }) => {
  commit(types.REMOVE_NOTIFICATION)
}

/**
 * Create a new user in Firebase
 */
export const tryCreateUser = async (context, { uid, ...data }) => {
  const ref = db.ref('users').child(uid)
  ref.transaction((userData) => {
    if (userData === null) {
      return data
    }
  })
}

/**
 * Add the UID to localStorage and store
 * @param {String} uid
 */
export const setUID = async ({ commit }, uid) => {
  localStorage.setItem(config.USER_ID_KEY, uid)
  commit(types.UPDATE_UID, uid)
}

/**
 * Remove the UID from localStorage and store
 */
export const removeUID = async ({ commit }) => {
  localStorage.removeItem(config.USER_ID_KEY)
  commit(types.REMOVE_UID)
}

/**
 * Set a user's current auth state
 */
export const getAuthStatus = async ({ commit, dispatch }) => {
  commit(types.AUTH_START)
  try {
    const user = await getCurrentUser()
    if (user) {
      commit(types.AUTH_SUCCESS, user.toJSON())
    }
    dispatch('authTokenRefresh')
    commit(types.AUTH_COMPLETE)
  } catch (err) {
    commit(types.AUTH_FAILED)
  }
}

/**
 * Destroy a user's session
 */
export const logout = ({ commit, dispatch }) => {
  commit(types.AUTH_START)
  try {
    signOut()
    dispatch('removeUID')
    commit(types.LOGOUT)
  } catch (err) {
    commit(types.AUTH_FAILED)
  }
}
