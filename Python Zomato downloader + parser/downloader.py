import requests
import json
import time

headers = {
    'Accept': 'application/json',
    'user-key': '2743f70708e02e0117c073ee60c8bab4',
}

start_lat = 48.198935
start_long = 16.976767

max_lat = 48.100553
max_long = 17.200356

lat_dif = (max_lat - start_lat) / 20
long_dif = (max_long - start_long) / 20

for x in range(0, 20):
    for y in range(0, 20):
        time.sleep(0.9)
        params = (
            ('lat', start_lat + x*lat_dif),
            ('lon', start_long + y*long_dif),
            ('radius', '10000'),
            ('sort', 'real_distance'),
        )

        print('Lat: '+str(start_lat + x*lat_dif))
        print('Long: '+str(start_long + y*long_dif))


        solditems = requests.get('https://developers.zomato.com/api/v2.1/search', headers=headers, params=params)

        data = solditems.json()
        print(data)
        with open('dataX-'+str(x)+'Y-'+str(y)+'.json', 'w') as f:
            json.dump(data, f)