from flask import Flask
from flask_bootstrap import Bootstrap
from flask.ext.socketio import SocketIO, emit
app = Flask(__name__)
from app import routes

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

bootstrap = Bootstrap(app)

