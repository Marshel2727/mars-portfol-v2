import os
from sqlalchemy.exc import OperationalError
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

def db_uri():
    user = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', '')
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '3306')
    name = os.getenv('DB_NAME', 'mars_portfol')

    return f'mysql+pymysql://{user}:{password}@{host}:{port}/{name}'

class Config():
    SQLALCHEMY_DATABASE_URI = db_uri()

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'rahasia-super-aman-portofolio-mars')

#untuk mengecek apakah data base sudah terkoneksi
def db_connection():
    uri = Config.SQLALCHEMY_DATABASE_URI
    try:
        engine = create_engine(uri)
        connect = engine.connect()
        print('data base berhasi terkoneksi')
        connect.close()
        return engine
    except OperationalError as e:
        raise RuntimeError(f'Data base {e}')
