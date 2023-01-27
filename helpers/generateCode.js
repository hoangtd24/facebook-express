function generateCode(length) {
    return Math.floor(Math.random() * Math.pow(10, length))
}

module.exports = generateCode