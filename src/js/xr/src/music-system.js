import * as Tone from 'tone'

// see https://github.com/Tonejs/Tone.js/wiki/Time
const timings = [
  ['+0:0:0', '+0:0:5', '+0:0:15', '+0:0:26'],
  ['+0:0:0', '+0:0:15', '+0:0:19', '+0:0:24'],
  ['+0:0:0', '+0:0:7'],
  ['+0:0:0']
]

const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const dissonant = ['A#', 'G#']

const octaves = [4, 5, 6]

let sampler
let reverb
let delay
let isPlaying = false

function choose(array, rand) {
  rand = rand || Math.random()
  return array[Math.floor(rand * array.length)]
}

function playSequence() {
  console.log('---')
  if (isPlaying) {
    let timing = choose(timings)
    timing.forEach((time, n) => {
      // convert to seconds
      time = Tone.Time(time).toSeconds()
      // slow down slightly over time
      time += n * 0.05
      // humanize
      time += (Math.random() * 2 - 1) * 0.05

      let allowed = [...notes]

      // after the first note, but before the last note
      // we can have little a dissonant note, as a treat
      if (
        n > 0 && n == timing.length - 1 - 1 ||
        n > 0 && n == timing.length - 1 - 2
      ) {
        allowed = [...allowed, ...allowed, ...dissonant]
        console.log(`allowing dissonant note for ${n} of ${timing.length}`)
      }

      let note = choose(allowed)
      let octave = choose(octaves, Math.pow(Math.random(), 2))
      let velocity = 0.3

      // humanize velocity
      velocity += (Math.random() * 2 - 1) * 0.05

      sampler.triggerAttackRelease(note + octave, '1n', time, velocity)

      console.log(`MusicSystem#playSequence ${n} triggerAR ${note + octave} 1n ${time} ${velocity}`)
    })
  }
}

function start () {
  console.log('MusicSystem#start')

  isPlaying = true
  // playSequence()
  setInterval(playSequence, Tone.Time('9m').toMilliseconds())
}

function init ({ urlMap, audioContext, audioNode, onComplete }) {
  console.log('MusicSystem#init', audioContext, audioNode)

  Tone.setContext(audioContext)

  reverb = new Tone.Freeverb(0.95)
  reverb.wet.value = 0.8

  sampler = new Tone.Sampler(
    urlMap,
    onComplete
  ).chain(reverb, audioNode.getOutput())

  return { sampler }
}

function setIsPlaying (value) {
  isPlaying = value
}

export {
  init,
  start,
  playSequence,
  setIsPlaying
}
