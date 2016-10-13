from flask import render_template, flash, redirect, session, url_for, request, g, jsonify
from flask.ext.login import login_user, logout_user, current_user, login_required
from app import app, db, lm, models
from .models import User, Campaign, PlotPoint, Tag
from .forms import LoginForm, CampaignForm, PlotPointForm
import json, os, re

@lm.user_loader
def load_user(id):
    return User.query.get(int(id))

@app.before_request
def before_request():
    g.user = current_user
    
@app.route('/login', methods=['GET', 'POST'])
def login():
    if g.user.get_id() is not None:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
	user = User.query.filter_by(username=username, password=password).first()
        if user is None:
            flash ('Username or password is invalid' , 'error')
            return redirect(url_for('login'))
        login_user(user)
        flash('Logged in successfully!')
	#session['remember_me'] = form.remember_me.data
        return redirect(url_for('user', userid=user.username))
    return render_template('login.html', title='Sign In', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/')
@app.route('/index')
@login_required
def index():
    users = models.User.query.all()
    user = g.user

    return render_template('index.html', title="Home", users=users, user=user)

@app.route('/<userid>', methods=['GET', 'POST'])
@login_required
def user(userid):
    user = g.user
    form = CampaignForm()
    data = {}

    if user == None:
        flash('User %s not found.' % userid)
        return redirect(url_for('index'))
    
    if form.validate_on_submit():
        campaign = Campaign(name=form.name.data, userid=user.id)
        db.session.add(campaign)
        db.session.commit()
        return redirect(url_for('user', userid=user.username))

    data['campaigns'] = user.campaigns

    return render_template('user.html', title='Campaigns', user=user, 
                           data=data, form=form)
    
@app.route('/<userid>/<name>/adventure/', methods=['GET', 'POST'])
@login_required
def campaign(userid, name):
    user = g.user
    if user == None:
        flash('User %s not found.' % userid)
        return redirect(url_for('index'))
    
    campaign = Campaign.query.filter_by(name=name).first()
    data = {}
    data["plot_points"] = campaign.plot_points.filter_by(trash=False, parent_id=None).order_by(PlotPoint.order)
    '''for x in data["plot_points"]:
        print "Look here: " + str(x.parent) + ", " + x.title'''

    data["tags"] = campaign.tag_list()
    data["parent"] = "Home"
    data["bookmark"] = None
    data["shortcuts"] = []

    return render_template('campaign/adventure/index.html', title=name, user=user, 
                           campaign=campaign, data=data)

@app.route('/home/', methods=['POST'])
@login_required
def home():
    user = g.user
    data = {}
    campaign = Campaign.query.filter_by(id=request.json['campaign']).first()
    plot_points = []
    for x in campaign.plot_points.filter_by(trash=False).order_by(PlotPoint.title):
        temp = { 'id' : x.id, 'title' : x.title, 'body' : x.body, 'tags' : x.tag_list(), 'bookmark' : x.bookmark, 'shortcut' : x.shortcut }
        plot_points.append(temp)
    return jsonify( { 'plot_points' : plot_points } )
    
@app.route('/bookmark/', methods=['POST'])
@login_required
def bookmark():
    user = g.user
    campaign = Campaign.query.filter_by(id=request.json['campaign']).first()
    bookmark = campaign.bookmark()
    if bookmark:
        data = { 'id' : bookmark.id, 'title' : bookmark.title, 'body' : bookmark.body, 'tags' : bookmark.tag_list(), 'bookmark' : bookmark.bookmark, 'shortcut' : bookmark.shortcut }
        has_bookmark = True
        parent = PlotPoint.query.filter_by(id=bookmark.parent_id).first()
        if parent:
            temp = parent.subplot_points.filter_by(trash=False).order_by(PlotPoint.order)
            parent_name = parent.title
        else:
            temp = campaign.plot_points.filter_by(trash=False, parent_id=None).order_by(PlotPoint.order)
            parent_name = "Adventure Home"
        plotpoint_list = []
        for x in temp:
            plotpoint_list.append({ 'id' : x.id, 'title' : x.title })
    else:
        data = {}
        has_bookmark = False
    return jsonify( { 'has_bookmark' : has_bookmark, 'bookmark' : data, 
                      'parent' : parent_name, 'plot_points' : plotpoint_list } )
    
@app.route('/shortcuts/', methods=['POST'])
@login_required
def shortcuts():
    user = g.user
    campaign = Campaign.query.filter_by(id=request.json['campaign']).first()
    shortcuts = []
    for x in campaign.shortcuts():
        shortcuts.append( { 'id' : x.id, 'title' : x.title, 'body' : x.body, 'tags' : x.tag_list(), 'bookmark' : x.bookmark, 'shortcut' : x.shortcut } )
    return jsonify( { 'shortcuts' : shortcuts } )

@app.route('/trash/', methods=['POST'])
@login_required
def trash():
    user = g.user
    data = {}
    campaign = Campaign.query.filter_by(id=request.json['campaign']).first()
    plot_points = []
    for x in campaign.plot_points.filter_by(trash=True).order_by(PlotPoint.title):
        temp = { 'id' : x.id, 'title' : x.title, 'body' : x.body, 'tags' : x.tag_list() }
        plot_points.append(temp)
    return jsonify( { 'plot_points' : plot_points } )
    
# Adventure Views
    
@app.route('/adventure/list/', methods=['POST'])
@login_required
def adventure_list():
    user = g.user
    campaign = Campaign.query.filter_by(id=request.form.get('campaign')).first()
    
    data = {}
    data["plot_points"] = campaign.plot_points.filter_by(trash=False, parent_id=None).order_by(PlotPoint.order)

    data["tags"] = campaign.tag_list()
    data["parent"] = "Home"
    data["bookmark"] = None
    data["shortcuts"] = []
    return render_template('campaign/adventure/list.html', title=campaign.name, 
                           user=user, campaign=campaign, data=data)
    
@app.route('/adventure/map/', methods=['POST'])
@login_required
def adventure_map():
    user = g.user
    campaign = Campaign.query.filter_by(id=request.form.get('campaign')).first()
    
    data = {}
    data["plot_points"] = campaign.plot_points.filter_by(trash=False, parent_id=None).order_by(PlotPoint.order)

    data["tags"] = campaign.tag_list()
    data["parent"] = "Home"
    data["bookmark"] = None
    data["shortcuts"] = []
    return render_template('campaign/adventure/map.html', title=campaign.name, 
                           user=user, campaign=campaign, data=data)
                           
@app.route('/plotpoint/map.html', methods=['GET', 'POST'])
@login_required
def map_plotpoint():
    user = g.user
    image = 'https://dl.dropboxusercontent.com/u/15296297/Briarstone%20Asylum%20-%20Map.jpg'
    return render_template('include/map.html', image=image)
    
@app.route('/adventure/map/edit/', methods=['GET', 'POST'])
@login_required
def edit_map():
    user = g.user
    image = 'https://dl.dropboxusercontent.com/u/15296297/Briarstone%20Asylum%20-%20Map.jpg'
    plotpoints = PlotPoint.query.order_by(PlotPoint.order)
    return render_template('campaign/adventure/edit-map.html', 
                           plotpoints=plotpoints, image=image)
    
@app.route('/plotpoint/', methods=['POST'])
@login_required
def plotpoint():
    user = g.user
    id = int(request.json['id'])
    plotpoint = PlotPoint.query.filter_by(id=id).first()
    return jsonify( { 'title' : plotpoint.title, 'body' : plotpoint.body, 'id' : id, 
                      'tags' : plotpoint.tag_list(), 'bookmark' : plotpoint.bookmark, 
                      'shortcut' : plotpoint.shortcut } )
    
@app.route('/save/plotpoint/', methods=['POST'])
@login_required
def save_plotpoint():
    user = g.user
    id = int(request.json['id'])
    plotpoint = PlotPoint.query.filter_by(id=id).first()
    plotpoint.title = request.json['title']
    plotpoint.body = request.json['body']
    db.session.add(plotpoint)
    db.session.commit()
    return jsonify( {'id' : plotpoint.id, 'title' : plotpoint.title })
    
@app.route('/trash/plotpoint/', methods=['POST'])
@login_required
def trash_plotpoint():
    user = g.user
    id = int(request.json['id'])
    plotpoint = PlotPoint.query.filter_by(id=id).first()
    plotpoint.trash = True
    plotpoint.bookmark = False
    plotpoint.shortcut = False
    plotpoint.parent_id = None
    db.session.add(plotpoint)
    db.session.commit()
    # Update order
    for index, x in enumerate(request.json['list']):
        id = int(re.sub('adventure-link-', '', x))
        plotpoint = PlotPoint.query.filter_by(id=id).first()
        plotpoint.order = index
        db.session.add(plotpoint)
        db.session.commit()
    # Get info for new active plot point
    next_id = int(request.json['id'])
    next_point = PlotPoint.query.filter_by(id=next_id).first()
    return jsonify( {'message' : 'success', 'id' : next_point.id, 
                     'title' : next_point.title, 'body' : next_point.body, 
                     'tags' : next_point.tag_list(), 
                     'bookmark' : next_point.bookmark, 
                     'shortcut' : next_point.shortcut })
    
@app.route('/reorder/plotpoint/', methods=['POST'])
@login_required
def reorder_plotpoint():
    user = g.user
    # Strips the beginning of the #id out, leaving only the plot point id
    for index, x in enumerate(request.json['list']):
        id = int(re.sub('adventure-link-', '', x))
        plotpoint = PlotPoint.query.filter_by(id=id).first()
        plotpoint.order = index
        db.session.add(plotpoint)
        db.session.commit()
    return jsonify( {'message' : 'success' })
    
@app.route('/new/plotpoint/', methods=['POST'])
@login_required
def new_plotpoint():
    user = g.user
    last_in_order = PlotPoint.query.order_by(PlotPoint.order)[-1]
    order_num = last_in_order.order + 1
    plotpoint = PlotPoint(title=request.json['title'], campaign=request.json['campaign'], order=order_num, body="", trash=False)
    db.session.add(plotpoint)
    db.session.commit()
    return jsonify( {'status' : 'Success!', 'id' : plotpoint.id, 'title' : plotpoint.title, 'body' : plotpoint.body } )
   
@app.route('/adventure/hierarchy/')
def adventure_hierarchy():
    campaign = Campaign.query.filter_by(id=request.args.get('campaign')).first()
    plotpoints = []
    for x in campaign.plot_points.filter_by(trash=False).order_by(PlotPoint.title):
        plotpoints.append( { 'id' : x.id, 'title' : x.title } )
    return jsonify( { 'plotpoints' : plotpoints } )
   
@app.route('/move/plotpoint/', methods=['POST'])
@login_required
def move_plotpoint():
    user = g.user
    child = PlotPoint.query.filter_by(id=request.json['child']).first()
    if request.json['parent']:
        parent = PlotPoint.query.filter_by(id=request.json['parent']).first()
    # Place the new child at the end of the list, or first if it's the only element
        if parent.subplots:
            last_in_order = parent.subplot_points.order_by(PlotPoint.order)[-1]
            child.order = last_in_order.order + 1
        else:
            child.order = 0
        child.parent_id = parent.id
    # Otherwise, the child is being moved to the root folder
    else:
        if PlotPoint.query.filter_by(trash=False, parent_id=None):
            last_in_order = campaign.plot_points.filter_by(trash=False, parent_id=None).order_by(PlotPoint.order)[-1]
            child.order = last_in_order.order + 1
        else:
            child.order = 0
        child.parent_id = None
    db.session.add(child)
    db.session.commit()
    # Get the list of subplot_points
    plot_points = []
    if child.parent_id:
        point_list = parent.subplot_points.order_by(PlotPoint.order)
    else:
        point_list = campaign.plot_points.filter_by(trash=False, parent_id=None).order_by(PlotPoint.order)
    for x in point_list:
        temp = { 'id' : x.id, 'title' : x.title, 'body' : x.body, 'tags' : x.tag_list(), 'bookmark' : x.bookmark, 'shortcut' : x.shortcut }
        plot_points.append(temp)
    return jsonify( {'id' : child.id, 'list' : plot_points })
   
# EDIT OPTIONS

@app.route('/bookmark/plotpoint/', methods=['POST'])
@login_required
def bookmark_plotpoint():
    user = g.user
    plotpoint = PlotPoint.query.filter_by(id=request.json['id']).first()
    plotpoint.toggle_bookmark()
    return jsonify( { 'active' : plotpoint.bookmark })
    
@app.route('/shortcut/plotpoint/', methods=['POST'])
@login_required
def shortcut_plotpoint():
    user = g.user
    plotpoint = PlotPoint.query.filter_by(id=request.json['id']).first()
    if plotpoint.shortcut:
        plotpoint.shortcut = False
    else:
        plotpoint.shortcut = True
    db.session.add(plotpoint)
    db.session.commit()
    print "Look here: " + str(plotpoint.shortcut)
    return jsonify( { 'active' : plotpoint.shortcut })
   
# TAGS

@app.route('/search/tags/', methods=['GET'])
@login_required
def search_tags():
    search = request.args.get('search')
    campaign = Campaign.query.filter_by(id=int( request.args.get('campaign') )).first()
    tags = [ t for t in campaign.tag_list() if t.startswith( search ) ]
    return jsonify( { 'results' : tags } )
    
@app.route('/tags/', methods=['POST'])
@login_required
def tags():
    campaign = Campaign.query.filter_by(id=request.json['campaign']).first()
    tags = campaign.tag_list()
    return jsonify( { 'results' : tags } )

@app.route('/add/tag/', methods=['POST'])
@login_required
def add_tag():
    user = g.user
    # Removes extraneous spaces
    tagname = ' '.join( request.json['tag'].split() )
    plotpoint = PlotPoint.query.filter_by(id=int(request.json['id'])).first()
    if plotpoint.tags.filter_by(name=tagname).first() is None: 
        new = True
    else: 
        new = False
    plotpoint.add_tag(tagname)
    db.session.add(plotpoint)
    db.session.commit()
    return jsonify( { 'message' : 'Success', 'name' : tagname, 'new' : new } )