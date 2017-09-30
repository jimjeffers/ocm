import React, { Component } from 'react';
import {divIcon, point} from 'leaflet';
import {Map, TileLayer, LayersControl, ZoomControl, ScaleControl, LayerGroup, Polygon, FeatureGroup, CircleMarker, Popup} from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'whatwg-fetch';
import {observer} from 'mobx-react';

import Radar from './map/Radar';
import {store} from './DataStore';
import PropertiesEditor from './PropertiesEditor';
import OSMClimbingDataLayer from './osm/OSMClimbingDataLayer';


const mapboxAttribution = 'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>';


store.registerMarkerHandler((change) => {
    const action = change.type;
    console.log('Store observer ', action);
    switch (action) {
        case 'add':
            const layer = change.newValue.layer;
            if (change.newValue.type ==='marker') {
                layer.on('click', function(e) {
                    // TODO: when in "interactive delete mode" (by clicking the Trash bin icon)
                    // we don't want to activate the popup dialog
                    //store.setUIState({event: UIState.ROUTE_TEXT_EDIT_INITIATED, target: layer._leaflet_id});
                    store.uiState.wantOpenRouteTextEditor(layer._leaflet_id);
                    console.log("marker clicked");
                });
            } else if (change.newValue.type === 'polygon') {

            }
            break;

        case 'delete':
            console.log('Old value ', change.oldValue);
            break;

        default:
            console.log('Action unknown: ', action);
    }
});






const mapboxUrl = "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidmlldGdvZXN3ZXN0IiwiYSI6ImNpbzljZnVwNTAzM2x2d2x6OTRpb3JjMmQifQ.rcxOnDEeY4McXKDamMLOlA";

const defaultMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    zIndexOffset: 1000  
};


// create custom icon based on the type of climb
function makeIconFor(geoJsonFeature) {
    return divIcon({
            html: '', 
            className: 'custom-marker-icon', 
            iconSize: [30, 30]});
}


const markerclusterOptions = {
    showCoverageOnHover: false,
   // spiderfyDistanceMultiplier: 1,

    // Setting custom icon for cluster group
    // https://github.com/Leaflet/Leaflet.markercluster#customising-the-clustered-markers
    iconCreateFunction: (cluster) => {
      return divIcon({
        html: `<span>${cluster.getChildCount()}</span>`,
        className: 'custom-cluster-icon',
        iconSize: point(40, 40, true)
      });
    },
};


function grade_hack(tags) {
    const regex = /^climbing:grade:.*$/;
    const results = [];
    for (var property in tags) {
        if (regex.test(property)) {
            results.push({[property]: tags[property]});
        }
    }
    return results;
}


function url_hack(name, tags) {
    if (tags === undefined) {
        return name;
    }
    var url;
    if (tags.website !== undefined) {
        url = tags.website;
    } else if (tags.url !== undefined) {
        url = tags.url;
    } else {
        return name;
    }
    return '<a href="' + url + '" target="_new">' + name + '</a>';
}


function url_hack2(name, tags) {
    if (tags === undefined) {
        return name;
    }
    var url;
    if (tags.website !== undefined) {
        url = tags.website;
    } else if (tags.url !== undefined) {
        url = tags.url;
    } else {
        return name;
    }
    return <a href={url} target='_new'>{name}</a>;
}


class RouteClustersLayer extends Component {

    render() {
        console.log('RouteClustersLayer:render()', this.props.routeData);
        if (this.props.routeData.features === undefined) {
            return <LayerGroup />;
        }

        const markers = this.props.routeData.features.map(
                function(feature) {
                    const customIcon = makeIconFor(feature);
                    var grade;
                    if (feature.properties.grade !== undefined) {
                        grade = feature.properties.grade.value;
                    } else {
                        grade = grade_hack(feature.properties.tags).map(item =>'<p>' + JSON.stringify(item) + '</p>');
                    }

                    const marker = {
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0],
                        popup: 'Name: ' + url_hack(feature.properties.name, feature.properties.tags) + ' ' + grade,
                        options: {icon: customIcon}
                    }
                    return marker;
                });
        return (
                <LayerGroup>
                    <MarkerClusterGroup
                        markers={markers}
                        wrapperOptions={{enableDefaultStyle: true}} 
                        options={markerclusterOptions}
                    />
                </LayerGroup>
                );
    }
}


class GeoJSONLayer extends Component {

    render() {
        return null;
        console.log('GeoJSONLayer.render()', this.props.data);
        if (this.props.data.features === undefined) {
            return <LayerGroup/>;
        }

        if (this.props.data.features.length < 1) {
            return <LayerGroup/>;
        }
        
        var keyId = -1;
        const polygons = this.props.data.features.map(
            function(feature) {
                keyId++;
                const coordinates = feature.geometry.coordinates[0];
                const pts = coordinates.map(p => [p[1], p[0]]);
                console.log("drawing area polygon: ", feature.properties, pts);
                return (<FeatureGroup key={keyId}>
                            <Polygon color='purple' positions={pts} />
                            <BoundaryHandleLayer2  coordinates={pts} properties={feature.properties} />
                        </FeatureGroup>
                        );
            }
        );
        console.log("polygons: ", polygons );
       return(<FeatureGroup>{polygons}</FeatureGroup>);        
    }
}


const BoundaryHandleLayer2 = class BoundaryHandleLayer extends Component {

    render() {
        const popupContent = url_hack2(this.props.properties.name, this.props.properties.tags);
        return (<BoundaryHandler 
                    key={this.props.keyId}
                    latlng={this.props.coordinates[0]}
                    popupContent={popupContent} />);
    }
}


//TODO: this handler is used by the drawing logic 
// we need to consolidate it iwth BoundaryHandleLayer2 
const BoundaryHandleLayer = observer(class BoundaryHandleLayer extends Component {

    constructor(props) {
        super(props);
        this.clickHandler = this.clickHandler.bind(this);
    }


    clickHandler(layerId) {
        console.log('Boundary handler clicked ', layerId);
        store.uiState.wantOpenBoundaryTextEditor(layerId);
    }


    render() {
        const polygons = store.store.values().filter(v => v.type === 'polygon');
        console.log("BoundaryHandleLayer ", polygons);
        if (polygons.length === 0) {
            return null;
        }
        return (
            <LayerGroup>
                {   
                  polygons.map(v =>
                   <BoundaryHandler 
                        key={v.layer._leaflet_id} 
                        latlng={v.layer._latlngs[0][0]}
                        clickHandler={this.clickHandler.bind(this, v.layer._leaflet_id)}/>)
                }
            </LayerGroup>
            );
    }
});


const BoundaryHandler = (props) => (
    <CircleMarker
        center={props.latlng} 
        color='white' 
        weight='3'
        fillColor='#a9cce3' 
        fillOpacity='1' 
        radius={15} >
            <Popup><span>Area name: {props.popupContent}</span></Popup>
    </CircleMarker>

);




export default class MainMap extends Component {

    constructor(props) {
        super(props);

        this.state = {
          lat: 37.0902,
          lng: -95.7129,
          zoom: 3,
          routeData: [],
          boundaryData: [1],
          leafletRef: null
        };
    }


    getMarkerStyle(feature, layer) {
        return defaultMarkerOptions;
    }


    componentDidMount() {
        console.log("### ref: ", this.leafletRef);
        this.setState({
            leafletRef: this.leafletRef.leafletElement
        });
    }


    getBBox = () => {
        const bboxLatLng = this.state.leafletRef.getBounds();
        return [bboxLatLng.getSouth(), bboxLatLng.getWest(), bboxLatLng.getNorth(), bboxLatLng.getEast()];
    }


    render() {
        return (
            <div className="mapRoot">
            <PropertiesEditor store={store}/>
            <Map 
                style={{height:'90%'}} 
                center={this.props.center}
                bounds={this.props.bbox}
                zoom={this.state.zoom} 
                zoomControl={false}
                maxZoom={22}
                onZoomEnd={(e) => 
                    this.setState({zoom: e.target._zoom})} 
                ref={(leaflet) => {this.leafletRef = leaflet}}>

                <ZoomControl position='bottomright' />
                <ScaleControl position='bottomleft'/>
                <LayersControl position='topleft'>
                    <LayersControl.BaseLayer name='Satellite'>
                        <TileLayer
                          attribution={mapboxAttribution}
                          url={mapboxUrl}
                          id='mapbox.satellite'/>
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name='Outdoors'>
                        <TileLayer
                          attribution={mapboxAttribution}
                          url={mapboxUrl}
                          id='mapbox.outdoors'/>
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer checked name='Light'>
                        <TileLayer
                          attribution={mapboxAttribution}
                          url='https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidmlldGdvZXN3ZXN0IiwiYSI6ImNpbzljZnVwNTAzM2x2d2x6OTRpb3JjMmQifQ.rcxOnDEeY4McXKDamMLOlA'
                          id='mapbox.light'/>
                    </LayersControl.BaseLayer>

                    <Radar zoomLevel={this.state.zoom} center={this.props.center} radius={this.props.radius} />         
                
                    <LayersControl.Overlay checked name='Routes'>
                        <RouteClustersLayer routeData={this.props.routeData} />
                    </LayersControl.Overlay>
                    <LayersControl.Overlay checked name='Areas'>
                        <GeoJSONLayer data={this.props.boundaryData} />
                    </LayersControl.Overlay>
                    <LayersControl.Overlay checked name='OSM data'>
                        <OSMClimbingDataLayer/>
                    </LayersControl.Overlay>
                    <LayersControl.Overlay checked name='Your edits'>
                        <LayerGroup>
                            <FeatureGroup>
                                <EditControl
                                  position='topleft'
                                  onEdited={this._onEditPath}
                                  onCreated={_onCreate}
                                  onDeleted={_onDeleted}
                                  onDeleteStop={_onDeleteStop}
                                  draw={{
                                    rectangle: false,
                                    circle: false,
                                    polygon: {
                                     shapeOptions: {
                                        color: '#8B4513',
                                        weight: 2,
                                        fillColor: '#778899',
                                        fillOpacity: 0.08,
                                        clickable: false,
                                        lineJoin: 'round'
                                        }
                                    }
                                  }}
                                />
                            </FeatureGroup>
                            <BoundaryHandleLayer />
                        </LayerGroup>
                    </LayersControl.Overlay>
                </LayersControl>

              </Map>
              </div>
            );
    } //render
};


function _onCreate(e) {
    console.log('Layer type: ', e.layerType);
    console.log("Layer: ", e.layer);
    const type = e.layerType;
    switch (type) {
        case 'marker':
            store.addObject(e.layer, 'marker');
            break;
        case 'polygon':
            console.log("New polygon: ", e.layer);
            store.addObject(e.layer, 'polygon');
            break;
        default:
            console.log("Layer type not supported: " + type);
    }
}

function _onDeleteStop(e) {
    console.log('_onDeleteStop ', e);
    console.log('store ', store.store.entries())
    //store.deleteObject(e.layer._leaflet_id);
}

function _onDeleted(e) {
    console.log('_onDeleted ', e);
    e.layers.eachLayer(function(l) {
            console.log('layer ', l);
            store.deleteObject(l._leaflet_id);
            });
    console.log('store ', store.store.entries())
}