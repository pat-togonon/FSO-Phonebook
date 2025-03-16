require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')

app.use(cors())
app.use(express.static('dist'))

const Person = require('./models/person')

app.use(express.json())

morgan.token('body', request => {
  return JSON.stringify(request.body) || 'No body'
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })  
})

const timestamp = () => {
  const now = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat']
  const day = dayNames[ now.getDay()]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  const month = monthNames[now.getMonth()]

  const monthDate = now.getDate()
  const year = now.getFullYear()
  const hour = now.getHours()
  const min = now.getMinutes()
  const sec = now.getSeconds()
  const timezone = -(now.getTimezoneOffset()) / 60

  const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  return `${day} ${month} ${monthDate}, ${year} ${hour < 10? 0 : ''}${hour}:${min < 10 ? 0 : ''}${min}:${sec < 10 ? 0 : ''}${sec} GMT${timezone > 0 ? '+' : '-'}${timezone} (${zoneName})`
   
}

app.get('/info', (request, response, next) => {
  Person.countDocuments({})
    .then(count => {
      response.send(`
       <div>
         <p>Phonebook has info for ${count} people.</p>
         <p>${timestamp()}</p>
       </div>
    `)
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      response.json(person)
    })
    .catch(error => next(error))
})

app.get('/api/persons/name/:name', (request, response, next) => {
   
  const nameToFind = decodeURIComponent(request.params.name).trim()
      
  Person.findOne({ name: {
    $regex: `^${nameToFind}$`, 
    $options: 'i' 
  }
  })
    .then(nameFound => {
      if (!nameFound) {
        return response.status(404).json({ error: 'Contact not yet on the list' })
      } 
      response.status(200).json(nameFound)      
    })
    .catch(error => next(error)) 
  
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(deletedPerson => {
      if (deletedPerson) {
        response.json({ message: 'Contact deleted successfully'})
      } else {
        response.status(400).json({ error: 'Contact is already deleted from the server'})
      }
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body
  
  const person = new Person({
    name: name,
    number: number
  })
  
  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => next(error))
    
})

app.put('/api/persons/:id', (request, response, next) => {
  
  const { name, number } = request.body

  Person.findOne({ name: name })
    .then(foundPerson => {
      Person.findByIdAndUpdate(
        foundPerson._id, 
        { name, number }, 
        { new : true, runValidators: true, context: 'query'}
      )
        .then(updatedPerson => {         
          if (updatedPerson) {           
            response.json(updatedPerson)
          } else {
            response.status(404).end()
          }
        })
        .catch(error => next(error))
    })
    .catch(error => next(error))
})


const errorHandler = (error, request, response, next) => {
  console.error('Error is: ', error.name, error.message)
   
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'Invalid. Please try again'})
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else {
    response.status(500).send({ error: 'Failed. Please check your server or connection.'})
  }
  next(error)
}

app.use(errorHandler)

// closing mongoose when app is terminated / exited

const closeMongoDatabase = () => {
  console.log('Closing Mongoose connection...')
  mongoose.connection.close()
    .then(() => {
      console.log('Mongoose connection closed')
      process.exit(0)
    })
    .catch(error => {
      console.error('Failed to close Mongoose: ', error)
      process.exit(1)
    })
}

process.on('SIGINT', closeMongoDatabase)
process.on('SIGTERM', closeMongoDatabase)


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
