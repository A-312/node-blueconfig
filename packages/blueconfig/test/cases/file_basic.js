exports.formats = [
  require('blueconfig-format-with-moment'),
  require('blueconfig-format-with-validator')
]

exports.conf = {
  ip: {
    doc: 'The IP Address to bind.',
    default: '127.0.0.1',
    format: 'ipaddress',
    env: 'IP_ADDRESS'
  },
  port: {
    default: 0,
    format: 'port',
    env: 'PORT',
    doc: 'The port to bind.'
  },
  session: {
    doc: 'Duration of the session',
    format: 'duration',
    default: '2 days'
  },
  cache: {
    doc: 'Duration of the cache',
    format: 'duration',
    default: '1 hour'
  }
}

exports.data = {
  ip: '10.0.1.101',
  port: 8080,
  session: '4 days',
  cache: 3000
}
