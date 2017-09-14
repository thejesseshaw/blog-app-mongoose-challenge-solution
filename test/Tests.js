const chai = require('chai');
const chaiHttp = require('chai-http');
// const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
function seedBlogData() {
    console.info('seeding Blog data');
    const seedData = [];
  
    for (let i=1; i<=10; i++) {
      seedData.push(generateBlogData());
    }
    // this will return a promise
    return BlogPost.insertMany(seedData);
}

function generateFirstNames() {
    const names = ['Destiney', 'Omari', 'Ryder', 'Khloe', 'Hunter', 'Lane', 'Laylah'];
    return names[Math.floor(Math.random() * names.length)];
}

function generateLastNames() {
    const names = ['Estes', 'Moon', 'Willis', 'York', 'Woodard', 'Knight', 'Ferrell'];
    return names[Math.floor(Math.random() * names.length)];
}

function generateTitle() {
    const title = [
        'Lonely Gate',
        'The Whispering Vision',
        'Tower of Birth',
        'The Gift\'s Truth',
        'The Heat of the End',
        'Tales in the Name'
    ];
    return title[Math.floor(Math.random() * title.length)];
}

function generateContent() {
    const content = [
        'Certainly elsewhere my do allowance at. The address farther six hearted hundred towards husband. Are securing off occasion remember daughter replying. Held that feel his see own yet. Strangers ye to he sometimes propriety in. She right plate seven has. Bed who perceive judgment did marianne.',
        'Out believe has request not how comfort evident. Up delight cousins we feeling minutes. Genius has looked end piqued spring. Down has rose feel find man. Learning day desirous informed expenses material returned six the. She enabled invited exposed him another. Reasonably conviction solicitude me mr at discretion reasonable. Age out full gate bed day lose.',
        'Extremely we promotion remainder eagerness enjoyment an. Ham her demands removal brought minuter raising invited gay. Contented consisted continual curiosity contained get sex. Forth child dried in in aware do. You had met they song how feel lain evil near. Small she avoid six yet table china. And bed make say been then dine mrs. To household rapturous fulfilled attempted on so.',
        'Full he none no side. Uncommonly surrounded considered for him are its. It we is read good soon. My to considered delightful invitation announcing of no decisively boisterous. Did add dashwoods deficient man concluded additions resources. Or landlord packages overcame distance smallest in recurred. Wrong maids or be asked no on enjoy. Household few sometimes out attending described. Lain just fact four of am meet high.',
        'Sociable on as carriage my position weddings raillery consider. Peculiar trifling absolute and wandered vicinity property yet. The and collecting motionless difficulty son. His hearing staying ten colonel met. Sex drew six easy four dear cold deny. Moderate children at of outweigh it. Unsatiable it considered invitation he travelling insensible. Consulted admitting oh mr up as described acuteness propriety moonlight.',
        'Situation admitting promotion at or to perceived be. Mr acuteness we as estimable enjoyment up. An held late as felt know. Learn do allow solid to grave. Middleton suspicion age her attention. Chiefly several bed its wishing. Is so moments on chamber pressed to. Doubtful yet way properly answered humanity its desirous. Minuter believe service arrived civilly add all. Acuteness allowance an at eagerness favourite in extensive exquisite ye.',
        'No in he real went find mr. Wandered or strictly raillery stanhill as. Jennings appetite disposed me an at subjects an. To no indulgence diminution so discovered mr apartments. Are off under folly death wrote cause her way spite. Plan upon yet way get cold spot its week. Almost do am or limits hearts. Resolve parties but why she shewing. She sang know now how nay cold real case.']
    return content[Math.floor(Math.random() * content.length)];
}

function generateBlogData() {
    return {
        author: {
            firstName: generateFirstNames(),
            lastName: generateLastNames()
        },
        title: generateTitle(),
        content: generateContent()
    }
}

function tearDownDb () {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog API Data', function() {
    // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedBlogData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET Endpoint', function() {
    console.log("Testing Get Enpoint");
    it('should return all existing blogposts', function() {

        let post;
        return chai.request(app)
          .get('/posts')
          .then(function(_post) {
            // so subsequent .then blocks can access resp obj.
            post = _post;
            post.should.have.status(200);
            // otherwise our db seeding didn't work
            post.body.should.have.length.of.at.least(1);
            return BlogPost.count();
          })
          .then(count => {
            post.body.should.have.lengthOf(count);
          });
      });
  
  
      it('should return blogposts with right fields', function() {
  
        let newBlogPosts;
        return chai.request(app)
          .get('/posts')
          .then(function(res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');
            res.body.should.have.length.of.at.least(1);
  
            res.body.forEach(function(blogpost) {
              blogpost.should.be.a('object');
              blogpost.should.include.keys(
                'author', 'title', 'content' );
            });
            console.log(res.body[0]);
            newBlogPosts = res.body[0];
            return BlogPost.findById(newBlogPosts.id);
          })
          .then(blogpost => {
            newBlogPosts.title.should.equal(blogpost.title);
            newBlogPosts.content.should.contain(blogpost.content);
            newBlogPosts.author.should.equal(`${blogpost.author.firstName} ${blogpost.author.lastName}`);
          });
      });
  });

  describe('POST Endpoint', function() {
    console.log("testing post endpoint");
    it('should add a new blogpost', function() {
              const newBlogPost = generateBlogData();
              // let mostRecentGrade;

              return chai.request(app)
                .post('/posts')
                .send(newBlogPost)
                .then(function(res) {
                  res.should.have.status(201);
                  res.should.be.json;
                  res.body.should.be.a('object');
                  res.body.should.include.keys(
                    'author', 'title', 'content');
                  res.body.title.should.equal(newBlogPost.title);
                  // cause Mongo should have created id on insertion
                  res.body.id.should.not.be.null;
                  res.body.content.should.equal(newBlogPost.content);
                  return BlogPost.findById(res.body.id);
                })
                .then(function(blogpost) {
                  blogpost.title.should.equal(newBlogPost.title);
                  blogpost.content.should.equal(newBlogPost.content);
                  // blogpost.borough.should.equal(newBlogPost.borough);
                  // blogpost.grade.should.equal(mostRecentGrade);
                  blogpost.author.firstName.should.equal(newBlogPost.author.firstName);
                  blogpost.author.lastName.should.equal(newBlogPost.author.lastName);
                  // blogpost.address.zipcode.should.equal(newBlogPost.address.zipcode);
                });
            });
  });

  describe('PUT Endpoint', function() {
    console.log("testing put endpoints");
    it('should update fields you send over', function() {
        const updateData = {
          title: 'fofofofofofofof',
          content: 'futuristic fusion'
        };
  
        return BlogPost
          .findOne()
          .then(function(blogpost) {
            updateData.id = blogpost.id;
  
            // make request then inspect it to make sure it reflects
            // data we sent
            return chai.request(app)
              .put(`/posts/${blogpost.id}`)
              .send(updateData);
          })
          .then(function(res) {
            res.should.have.status(204);
  
            return BlogPost.findById(updateData.id);
          })
          .then(function(blogpost) {
            blogpost.title.should.equal(updateData.title);
            blogpost.content.should.equal(updateData.content);
          });
        });
  });

  describe('DELETE Endpoint', function() {
    console.log("testing Delete endpoints");
    it('delete a blogpost by id', function() {
        
        let blogpost;
        
        return BlogPost
        .findOne()
        .then(function(_blogpost) {
            blogpost = _blogpost;
            return chai.request(app).delete(`/posts/${blogpost.id}`);
        })
        .then(function(res) {
            res.should.have.status(204);
            return BlogPost.findById(blogpost.id);
        })
        .then(function(_blogpost) {
            should.not.exist(_blogpost);
        });
    });
  });
});