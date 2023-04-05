const jwt = require('jsonwebtoken')

exports.createToken = (payload, expiresIn) => {
    return jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn
    })
}

