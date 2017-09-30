import React from 'react';
import {LayerGroup, GeoJSON, FeatureGroup, CircleMarker, Popup} from 'react-leaflet';
import {observer, toJS} from 'mobx-react';

import {store} from './../DataStore';


const OSMClimbingDataLayer = observer(() => {
    if (store.osmData === undefined || store.osmData.length < 1) {
        return (<LayerGroup/>);
    }

    const jsonData = store.osmData.slice();
   
   console.log("osm json: ", jsonData);

   return <OSMWorkerComponent geojson={jsonData} />
});


const OSMWorkerComponent = ({geojson}) => {
    if (geojson === undefined || geojson.length < 1) {
        return <LayerGroup/>;
    }
    var index=-1;
    const dataLayer = geojson.map(
        function(feature) {
            index++;
            const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
            return (
                
                    <CircleMarker key={index} center={latlng}  color='white' weight='3'/>
                )
        }
    );
    return (
        <LayerGroup>
            {dataLayer}
        </LayerGroup>
    )
}



var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

const p2L = (pts, latlng) => {

    console.log('point2Layer ', pts);
  //  return <CircleMarker center={pts}  color='white' weight='3'/>
}


export default OSMClimbingDataLayer;