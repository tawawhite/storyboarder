const THREE = require('three')
const React = require('react')
const { useState, useReducer, useMemo, useCallback } = React

const { GLTFLoader} = require("three/examples/jsm/loaders/GLTFLoader")

const reducer = (state, action) => {
  const { type, payload } = action
  const { id, progress, value, error } = payload

  switch (type) {
    case 'PENDING':
      // ignore if already exists
      return (state[id])
        ? state
        : {
          ...state,
          [id]: { status: 'NotAsked' }
        }
    case 'LOAD':
      // ignore if already loading
      return (state[id].loading)
        ? state
        : {
          ...state,
          [id]: { status: 'Loading' }
        }
    case 'PROGRESS':
      return {
        ...state,
        [id]: {
          status: 'Loading',
          progress: {
            loaded: progress.loaded,
            total: progress.total,
            percent: Math.floor(
              progress.loaded / progress.total
            ) * 100
          }
        }
      }
    case 'SUCCESS':
      return {
        ...state,
        [id]: { status: 'Success', value }
      }
    case 'ERROR':
      return {
        ...state,
        [id]: { status: 'Error', error }
      }
    default:
      return state
  }
}

/**
 * HACK
 * @todo Fix unexpected 404 error from the server
 * Sometimes, server returns 404 error, but file exist.
 * Request file multiple times, if still getting 404 then call onerror callback.
 * */
const MaxTimes = 3
const load = (loader, path, events, times = 1) => {
  try {
    loader.load(
      path,
      events.onload,
      events.onprogress,
      (error) => {
        if (times >= MaxTimes || (error.code && error.code !== 404)) {
          events.onerror(error)
        } else {
          load(loader, path, events, times + 1)
        }
      }
    )
  } catch (e) {
    console.error(e)
  }
}

const useAssetsManager = () => {
  const [loader] = useState(() => new GLTFLoader())
  const [textureLoader] = useState(() => new THREE.TextureLoader())

  const [assets, dispatch] = useReducer(reducer, {})

  useMemo(() => {
    Object.entries(assets)
      .filter(([_, o]) => o.status === 'NotAsked')
      .filter(([id]) => id !== false)
      .forEach(([id]) => {
        if (!id.includes('/images/')) {
          load(loader, id, {
            onload: value => dispatch({ type: 'SUCCESS', payload: { id, value } }),
            onprogress: progress => dispatch({ type: 'PROGRESS', payload: { id, progress } }),
            onerror: error => dispatch({ type: 'ERROR', payload: { id, error } })
          })
          dispatch({ type: 'LOAD', payload: { id } })
        } else {
          load(textureLoader, id, {
            onload: value => dispatch({ type: 'SUCCESS', payload: { id, value } }),
            onprogress: progress => dispatch({ type: 'PROGRESS', payload: { id, progress } }),
            onerror: error => dispatch({ type: 'ERROR', payload: { id, error } })
          })
          dispatch({ type: 'LOAD', payload: { id } })
        }
      })
  }, [assets])

  const requestAsset = useCallback(
    id => {
      if (id && (!assets[id])) {
        dispatch({ type: 'PENDING', payload: { id }})
      }
      
      return null
    },
    []
  )

  const getAsset = useCallback(
    id => assets[id] ? assets[id].value : requestAsset(id),
    [assets]
  )

  return { assets, requestAsset, getAsset }
}

module.exports = {
  useAssetsManager
}
