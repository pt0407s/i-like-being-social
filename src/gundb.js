import Gun from 'gun/gun'
import 'gun/sea'

const gun = Gun({
  peers: [
    'https://gun-manhattan.herokuapp.com/gun',
    'https://gunjs.herokuapp.com/gun',
    'https://e2eec.herokuapp.com/gun'
  ],
  localStorage: true,
  radisk: true
})

export default gun
