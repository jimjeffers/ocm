import React from 'react';
import {LayerGroup, GeoJSON, FeatureGroup, CircleMarker, Popup, Tooltip} from 'react-leaflet';
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
            var relations = '<none>';
            if (feature.properties.relations && feature.properties.relations.length > 0) {
                relations = feature.properties.relations.map(
                    item => item.reltags.name
                ).join(',');
            }
            return (
                    <CircleMarker key={index} center={latlng}  color='white' weight='3'>
                        <Tooltip>
                            <span>
                              Name: {feature.properties.tags.name}<br/>
                              OSM Type: {feature.properties.type}<br/>
                              OSM Relation: {relations }
                            </span>
                        </Tooltip>
                    </CircleMarker>
                )
        }
    );
    return (
        <LayerGroup>
            {dataLayer}
        </LayerGroup>
    )
}


export default OSMClimbingDataLayer;