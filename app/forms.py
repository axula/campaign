from flask_wtf import Form
from wtforms import StringField, BooleanField, PasswordField, TextAreaField
from wtforms.validators import DataRequired

class LoginForm(Form):
	username = StringField('username', validators=[DataRequired()])
	password = PasswordField('password', validators=[DataRequired()])
	remember_me = BooleanField('remember_me', default = False)
    
class CampaignForm(Form):
    name = StringField('name', validators=[DataRequired()])
    
class PlotPointForm(Form):
    title = StringField('title', validators=[DataRequired()])
    body = TextAreaField('body')