require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

const SAMPLE_OBJECT_ID = 'cccccccccccc' // 12 byte string
const SAMPLE_MESSAGE_ID = 'bbbbbbbbbbbb' // 12 byte string

describe('Message API endpoints', () => {
    beforeEach((done) => {
        // TODO: add any beforeEach code here
        const testUser1 = new User({
            username: 'user1',
            password:'password',
            _id:SAMPLE_OBJECT_ID
        })
        testUser1.save()
        .then(() => {
            const message1 = new Message({
                title: 'test',
                body: 'testing',
                author: SAMPLE_OBJECT_ID,
                _id:SAMPLE_MESSAGE_ID
            })
            message1.save()
        })
        .then(() => {done()})
    })

    afterEach((done) => {
        Message.deleteMany({title: ['test']})
        .then(() => {
            User.deleteMany({username: ['user1']})
            .then(() => {
                done();
            });
        });
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages')
        .end((err, res) => {
            if(err) {done(err)}
            expect(res).to.have.status(200);
            expect(res.body.messages).to.be.an("array")
            done();
        });
    })

    it('should get one specific message', (done) => {
        chai.request(app)
        .get(`/messages/${SAMPLE_MESSAGE_ID}`)
        .end((err, res) => {
            if(err){ done(err) }
            expect(res).to.have.status(200);
            expect(res.body.title).to.equal('test');
            done();
        });
        
    })

    it('should post a new message', (done) => {
        chai.request(app)
        .post('/messages')
        .send({title: 'test2', body:'testing again', author: SAMPLE_OBJECT_ID})
        .end((err, res) => {
            if(err){done(err)}
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('title')

            done()
        })  
    })

    it('should update a message', (done) => {
        chai.request(app)
        .put(`/messages/${SAMPLE_MESSAGE_ID}`)
        .send({title: 'test', body: 'message changed', author:SAMPLE_OBJECT_ID})
        .end((err, res) => {
            if(err){done(err)}
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('title')

            // check to see if message was updated
            Message.findOne({title:'test'}).then((message) => {
                expect(message).to.have.property('body')
                done()
            })
        })
    })

    it('should delete a message', (done) => {
        chai.request(app)
        .delete(`/messages/${SAMPLE_MESSAGE_ID}`)
        .end((err, res) => {
            if(err){done(err)}
            expect(res.body.message).to.equal('Successfully deleted.')
            expect(res.body._id).to.equal(SAMPLE_MESSAGE_ID)

            //check the message was removed from the database
            Message.findOne({title:'test'}).then(message => {
                expect(message).to.equal(null)
                done()
            })
        })
    })
})
