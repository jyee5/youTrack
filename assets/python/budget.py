import sqlite3 as db
class budgeter:
    def __init__(self):
        conn = db.connect('spend.db')
        cur = conn.cursor()
        sql = '''
        create table if not exists expenses (
            amount number,
            category string, 
            message string, 
            date string
            )
        '''
        cur.execute(sql)
        conn.commit()

    def log(self, amount, category, message=''):
        from datetime import datetime
        date = str(datetime.now())
        conn = db.connect('spen.db')
        cur = conn.cursor()
        sql = '''
        insert into expenses values (
            {},
            '{}',
            '{}',
            '{}'
            )
        '''.format(amount, category, message, date)
        cur.execute(sql)
        conn.commit()

    def view(self, category=None):
        conn = db.connect('spend.db')
        cur = conn.cursor()
        if category:
            sql = '''
            select * from expenses where category = '{}'
            '''.format(category)
            sql2 = '''select sum(amount) from expenses where category = '{}'
            '''.format(category)
        else:
            sql = '''
            select * from expenses
            '''
            sql2 = '''select sum(amount) from expenses
            '''
        cur.execute(sql)
        result = cur.fetchall()
        cur.execute(sql2)
        total = cur.fetchone()[0]
        return total, result
    
john = budgeter()
john.log(100, 'movie', 'hello')
print(john.view())
