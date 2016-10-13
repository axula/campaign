from app import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password = db.Column(db.String(64))
    email = db.Column(db.String(120), index=True, unique=True)
    campaigns = db.relationship('Campaign', backref='gamemaster', lazy='dynamic')

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        try:
            return unicode(self.id) # python 2
        except NameError:
            return str(self.id) # python 3

    def __repr__(self):
        return '<User %r>' % (self.username)
        
class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    userid = db.Column(db.Integer, db.ForeignKey('user.id'))
    plot_points = db.relationship('PlotPoint', backref='adventure', lazy='dynamic')

    def tag_list(self):
        tags = []
        for plotpoint in self.plot_points: 
            tags.extend([ i.name for i in plotpoint.tags if i not in tags ])
        return sorted(tags)
        
    def has_tag(self, tagname):
        if tagname in self.tag_list():
            return True
        return False
    
    def bookmark(self):
        return self.plot_points.filter_by(bookmark=True).first()
    
    def shortcuts(self):
        return self.plot_points.filter_by(shortcut=True)
    
    def __repr__(self):
        return '<Campaign %r>' % (self.name)
        
tags_plotpoint = db.Table('tags_plotpoint', 
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')), 
    db.Column('plotpoint_id', db.Integer, db.ForeignKey('plot_point.id'))
)

class PlotPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order = db.Column(db.Integer)
    campaign = db.Column(db.Integer, db.ForeignKey('campaign.id'))
    title = db.Column(db.String(120))
    body = db.Column(db.Text)
    trash = db.Column(db.Boolean, default=False)
    bookmark = db.Column(db.Boolean, default=False)
    shortcut = db.Column(db.Boolean, default=False)
    tags = db.relationship('Tag', secondary=tags_plotpoint, 
           backref='plotpoints', lazy='dynamic')
    
    parent_id = db.Column(db.Integer, db.ForeignKey('plot_point.id'))
    subplot_points = db.relationship('PlotPoint', backref='subplot', remote_side=[id])
           
    def toggle_bookmark(self):
        # If it is already the bookmark, unbookmark it
        if self.bookmark:
            self.bookmark = False
            db.session.add(self)
        else:
            # Unbookmark previous bookmark, if any
            if self.adventure.bookmark():
                old = self.adventure.bookmark()
                old.bookmark = False
                db.session.add(old)
            self.bookmark = True
        db.session.commit()
        return self
    
    def has_subplot(self):
        if self.subplot_points:
            return True
        return False
    
    def tag_list(self):
        data = []
        for tag in self.tags:
            data.append(tag.name)
        return data
    
    def add_tag(self, tagname): 
        # Check if the tag already exists
        if Tag.query.filter_by(name=tagname).first() is None: 
            tag = Tag(name=tagname)
            db.session.add(tag)
            db.session.commit()
        else: 
            tag = Tag.query.filter_by(name=tagname).first()
        if tag not in self.tags: 
            self.tags.append(tag)
            return self
            
    def remove_tag(self, tagname): 
        if tagname in self.tags:
            tag = Tag.query.filter_by(name=tagname).first()
            self.tags.remove(tag)
            # If the tag is no longer used, delete it
            if not tag.in_use():
                db.session.delete(tag)
                db.session.commit() 
            return self
            
    def hierarchy(self):
        data = []
        child = self
        count = 0
        # So it doesn't go for too long
        while ( count < 100 ):
            if child.parent_id:
                parent = PlotPoint.query.filter_by(id=self.parent_id)
                data.append( { 'id' : parent.id, 'title' : parent.title } )
                # Check if the parent is in turn a child next
                child = parent
                count += 1
            else: 
                return data

    def __repr__(self):
        return '<Plot Point %r>' % (self.title)
        
class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32))
        
    def in_use(self):
        return self.plotpoints is not None

    def __repr__(self):
        return '<Tag %r>' % (self.name)