const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

app.use(cors());
app.use(express.static('dist'));

let persons = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
];

app.use(express.json());

morgan.token('body', request => {
  return JSON.stringify(request.body) || 'No body'
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

app.get('/api/persons', (request, response) => {
  response.json(persons)
});

const timestamp = () => {
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"]
  const day = dayNames[ now.getDay()];
  // March 10, 2025 hh:mm:ss GMT+ (EasternEuropean)

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
  const month = monthNames[now.getMonth()];

  const monthDate = now.getDate();
  const year = now.getFullYear();
  const hour = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const timezone = -(now.getTimezoneOffset()) / 60;

  const zoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return `${day} ${month} ${monthDate}, ${year} ${hour}:${min}:${sec < 10 ? 0 : ""}${sec} GMT${timezone > 0 ? "+" : "-"}${timezone} (${zoneName})`;
   
};

app.get('/info', (request, response) => {
  response.send(`
  <div>
   <p>Phonebook has info for ${persons.length} people.</p>
   <p>${timestamp()}</p>
  </div>
  `)  
});

app.get('/api/persons/:id', (request, response) => {
  const id = request.params.id;
  const person = persons.find(person => person.id === id);

  if (person) {  
  response.json(person);
  } else {
  response.status(404).end();
  }
});

app.delete('/api/persons/:id', (request, response) => {
  const id = request.params.id;
  const deletedPerson = persons.find(person => person.id === id);
 
  if (deletedPerson) {
   persons = persons.filter(person => person.id !== id);
   response.json(deletedPerson);
   return;
   } else {
     return response.status(400).json({
     error: 'Already deleted from server'
   });
  }
});

const generateId = () => {
 return Math.floor(Math.random() * 1e12);

};

app.post('/api/persons', (request, response) => {
  const body = request.body;

  if (!body.name) {
   return response.status(400).json({
     error: 'Please input name'
   });
  }
  
  if (!body.number) {
    return response.status(400).json({
      error: 'Please input number'
    });
  }

  if (persons.find(person => person.name === body.name)) {
    return response.status(400).json({
      error: 'name must be unique'
     });
  }

   const person = {
        id: generateId().toString(),
        name: body.name,
        number: body.number
   };
  
  persons = persons.concat(person);
  console.log(persons);
  response.json(person);

});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
