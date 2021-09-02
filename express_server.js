// initialize constants for the server
const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

// middleware configuration
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine','ejs');


/*
	app databases
*/

// url database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


// users database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
	}
}


/* 
	app functions
*/

// generate a unique ID
const generateRandomString = (obj) => {
  const uid = Math.random().toString(36).substring(2, 8);
	if (uid in obj) {
		generateRandomString();
	}
	return uid;
};

const userExists = (emailAddr, db) => {
		for (let userId in db) {
			if (db[userId].email === emailAddr) {
				return db[userId]; // return the user object
			}
		}
		return false;
	};

const validEmail = emailAddr => {
	const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(emailAddr).toLowerCase());
}

const validPassword = input => {
	const pwRegex=  /^[A-Za-z]\w{0,20}$/;
	return (input !== undefined && input.match(pwRegex) ? true : false)
}
/* 
	Route definitions 
*/

// render register page
app.get("/register", (req, res) => {
	const templateVars = { 
		username: req.cookies["user_id"],
	};
  res.render("register", templateVars);
});

// process user registration
app.post("/register", (req, res) => {

	const email = req.body.email;
	const password = req.body.password;

	if (!validEmail(email)) {
		return res.status(422).send('Email is invalid').end();
	}

	if (userExists(email, users)) {
		return res.status(409).send('A user already exists. Please try the login page').end();
	}

	if (!validPassword(password)) {
		return res.status(422).send('password is invalid').end();
	}

	const id = generateRandomString(users);
	
	users[id] = {
		id,
		email,
		password
	}

	console.log(users);
	res.cookie('user_id', id);
	res.redirect("/urls");		
});


// render login page
app.get("/login", (req, res) => {
	const templateVars = { 
		username: req.cookies["user_id"],
	};
  res.render("login", templateVars);
});

// process user login
app.post("/login", (req, res) => {
	
	const email = req.body.email;
	const password = req.body.password;
	const user = userExists(email,users);

	if (!user) {
		return res.status(404).send("There's no account with this email address! Please register").end();
	}

	if (user.password !== password) {
		return res.status(401).send("Incorrect email/password combination - please check!").end();
	}

	res.cookie('user_id', user.id);
	res.redirect("/urls");
});

// process user logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect(`/urls`);
});



// render all urls index
app.get("/urls", (req, res) => {
  const templateVars = { 
		username: req.cookies["user_id"],
		urls: urlDatabase 
	};
  res.render("urls_index", templateVars);
});

// render individual url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
		username: req.cookies["user_id"],
		shortURL: req.params.shortURL, 
		longURL: urlDatabase[req.params.shortURL] 
	};
  res.render("urls_show", templateVars);
});

// update existing longURL 
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

// delete existing url
app.post("/urls/:id/delete", (req, res) => {
  // delete given property/url from the object
	delete urlDatabase[req.params.id];
	res.redirect(`/urls`)
});

// process short to longURL redirect
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// render page to add new url
app.get("/urls/new", (req, res) => {
	const templateVars = { 
		username: req.cookies["user_id"],
	};
  res.render("urls_new", templateVars);
});

// process the newly added URL
app.post("/urls", (req, res) => {
  const tinyURL = generateRandomString(urlDatabase);
  urlDatabase[tinyURL] = req.body.longURL;
  res.redirect(`/urls/${tinyURL}`);
});

/* 
	app activation
*/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});