import React, { Component } from 'react';

import MainMap from './Map';
import MyNavbar from './nav';
import SearchBar from './SearchBar';

import {store} from './DataStore';

const turfBuffer = require('@turf/buffer');
const turfHelpers = require('@turf/helpers');
const turfBbox = require('@turf/bbox');


const makeBBox = (center, radius) => {
    const f = turfHelpers.point(center);
    const b = turfBuffer(f, radius, 'meters');
    return turfBbox(b);
}


const bboxFlip = (bbox) => ([[bbox[1], bbox[0]],
                             [bbox[3], bbox[2]]]);

const lngLatFlip = (center) => ([center[1], center[0]]);
 

/*
* ####################################
* ## This is where the app begins ! ##
* ####################################
*/
export default class ReactApp extends Component {

    constructor(props) {
        super(props);
        const initialCenter = [8.67972,50.11361]; //TODO: get center from browser's geolocation
        this.state = {
            center: initialCenter,
            bbox: makeBBox(initialCenter, 200000),
            radius: 200000,
            zoom: 2,
            routeData: {features: []},
            boundaryData: {features: []},
            error:{
                code: 200,
                msg: ''
            },
            unit: 'metric',
        }
    }


    okHandler = (backendData) => {
        console.log(backendData);
        this.setState({
                routeData: backendData.route,
                boundaryData: backendData.boundary,
                error: {code: 200}
        });
    }


    errorHandler = (response) => {
        this.setState({
            error: {
                code: response.status,
                msg: response.statusText
            }
        });
    }


    updateMapCenter = ({geocode, radius}) => {
        console.log('Map filters:', geocode, radius);
        const bbox=makeBBox(geocode.center, radius);
        this.loadData({center: geocode.center, radius: radius});
        this.setState({
            center: geocode.center,
            bbox: bbox,
            radius: radius
        });
    }


    loadData = ({center, radius}) => {
        const options = {center: center, radius: radius, okHandler: this.okHandler, errorHandler: this.errorHandler};
        store.backend.load(options);
    }

    componentDidMount() {
        //this.loadData({center: this.state.center, radius: this.state.radius});
    }

    render() {
        // Important: Leaflet expects [Lat,Lng] 
        // so we need to reverse [x,y] of center and bbox 
        // before passing them to MainMap.
        // Other components that accept Geojson will need to handle
        // the flipping as needed.
        const {center, bbox, ...theRest} = this.state;
        return (
            <div>
                <div className="navBar">
                    <MyNavbar mapRef={this.mainMap}>
                        <SearchBar initialSearch="" updateMapCenter={this.updateMapCenter}/>
                    </MyNavbar>
                </div>
                <div>
                    <MainMap center={lngLatFlip(center)} bbox={bboxFlip(bbox)} {...theRest} ref={(mainMap)=>{this.mainMap = mainMap}}/>
                </div>
            </div>
    );} // render()
}