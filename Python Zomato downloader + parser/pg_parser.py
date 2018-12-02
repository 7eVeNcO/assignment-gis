import os
import json
import psycopg2

def parse_file(file):
    print(file)
    with open('D:/data/'+file, 'r', encoding="utf-8") as f:
        data = json.load(f)
        f.close()

        max = len(data["restaurants"])
        for i in range(0, max):
            rest_id = data["restaurants"][i]["restaurant"]["id"]
            print(rest_id)
            print(type(rest_id))

            name = data["restaurants"][i]["restaurant"]["name"]
            print(name)

            lat = data["restaurants"][i]["restaurant"]["location"]["latitude"]
            print(lat)
            print(type(lat))

            long = data["restaurants"][i]["restaurant"]["location"]["longitude"]
            print(long)

            rating = data["restaurants"][i]["restaurant"]["user_rating"]["aggregate_rating"]
            print(rating)

            rating_count = data["restaurants"][i]["restaurant"]["user_rating"]["votes"]
            print(rating_count)

            amenity = data["restaurants"][i]["restaurant"]["cuisines"]
            print(amenity)

            # conn = psycopg2.connect("host=192.168.99.100 dbname=gis user=postgres")
            conn = psycopg2.connect("host=localhost dbname=gis-bratislava user=test password=1234")

            cur = conn.cursor()

            try:
                cur.execute("""INSERT INTO restaurants(id, path, name, rating_avg, rating_count, amenity) VALUES (%s, ST_GeomFromText(%s, 4326), %s, %s, %s, %s)""",
                            (rest_id, 'POINT( '+long+' '+lat+' )', name, rating, rating_count, amenity,))
            except psycopg2.IntegrityError:
                conn.rollback()
            else:
                conn.commit()



for file in os.listdir("D:\data"):
    parse_file(file)
