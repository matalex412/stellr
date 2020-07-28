import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from firebase_admin import auth

# Fetch the service account key JSON file contents
cred = credentials.Certificate('src/serviceAccountKey.json')

# Initialize the app with a service account, granting admin privileges
app = firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://skoach-7d39b.firebaseio.com'
})

# As an admin, the app has access to read and write all data, regradless of Security Rules
for user in auth.list_users().iterate_all():
    if (len(user.provider_data) == 0):
    	auth.delete_user(user.uid)

