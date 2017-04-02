import {useStrict, observable, action} from 'mobx';
import Backend from './Backend';

useStrict(true);

export const backend = new Backend();


const INITIAL_GEO_PROPS = {
    'marker': {
        name: '',
        grade: {
            value: '',
            type: ''
        }
    }
}


export const UIState = {
    INITIAL: "initial",
    ROUTE_TEXT_EDIT_INITIATED: "route-text-edit-initiated",
    ROUTE_TEXT_EDIT_STARTED: "route-text-edit-started",
    ROUTE_TEXT_EDIT_COMPLETED: "route-text-edit-completed",
    BOUNDARY_TEXT_EDIT_INITIATED: "boundary-text-edit-initiated",
    BOUNDARY_TEXT_EDIT_STARTED: "boundary-text-edit-started",
    BOUNDARY_TEXT_EDIT_COMPLETED: "boundary-text-edit-completed",

}


export const GradeType = {
        YSD: 'Yosemite Decimal System',
        V: 'Hueco V-scale',
        FR: 'French',
    }

export class Grade {
	constructor(value, type) {
		this.value = value;
		this.type = type;
	}
}

export class Route {
	constructor(name, grade) {
		this.name = name;
		this.grade = grade;
	}
}

export class Marker {
	constructor(layer) {
		this.layer = layer;
	}
}

const state = {
    event: UIState.INITIAL,
    target: 0,
    modalShouldOpen: false,

    get currentState() {
        return this.event;
    },


    wantOpenRouteTextEditor: action(function(_target) {
        this.event = UIState.ROUTE_TEXT_EDIT_INITIATED;
        this.target = _target;
        this.modalShouldOpen = true;
    }),


    wantCloseRouteTextEditor: action(function(target){
        this.event = UIState.INITIAL;
        this.target = target;
        this.modalShouldOpen = false;
    }),


    wantOpenBoundaryTextEditor: action(function(target){
        this.event = UIState.BOUNDARY_TEXT_EDIT_INITIATED;
        this.target = target;
        this.modalShouldOpen = true;
    }),

    wantBeginEdit: action(function(target){
        switch(this.event) {
            case UIState.BOUNDARY_TEXT_EDIT_INITIATED:
                this.event = UIState.BOUNDARY_TEXT_EDIT_STARTED;
                break;
            case UIState.ROUTE_TEXT_EDIT_INITIATED:
                this.event = UIState.ROUTE_TEXT_EDIT_STARTED;
                break;
            default:
                console.log("wantBeginEdit() Unexpected state ", this.event);
        }
    }),

    wantCloseBoundrayTextEditor: action(function(target){
        this.event = UIState.INITIAL;
        this.target = target;
        this.modalShouldOpen = false;
    }),

    wantCloseCurrent: action(function(target){
        console.log("wnatCloseCurrent() current state ", this.event);
        if (this.event === UIState.ROUTE_TEXT_EDIT_INITIATED 
            || this.event === UIState.BOUNDARY_TEXT_EDIT_INITIATED) {
            this.event = UIState.INITIAL;
            this.target = target;
            this.modalShouldOpen = false;
        }
    }),

    wantSubmitData: action(function(target) {
        console.log("wantSubmitData() ");
    })
}


export class EditableObject {
    constructor(layer, type, props) {
        this.type = type;
        this.layer = layer;
        const geojsonFeature = {
            type: 'Feature',
            properties: {}
        };
        this.layer.feature = geojsonFeature;
        this.props = props;
    }
}

export class DataStore {
	uiState = observable(state);
	store = observable.map();

	
	addObject(layer, type) {
        console.log("addObject() id=%s, type=%s", layer._leaflet_id, type); 
        this.store.set(layer._leaflet_id, new EditableObject(layer, type, null));
    }


    deleteObject(id) {
        this.store.delete(id);
    }


    updateFeatureProps(id, props) {
        const obj = this.store.get(id);
        obj.props = props;
        obj.layer.feature.properties = props;
    }


    getFeature(id) {
        return this.store.get(id);
    }


    registerMarkerHandler(fn) {
        this.store.observe(fn);
    }


    saveToBackend() {
        //console.log(this.store.values());
        const features = this.store.values().map(item => item.layer.toGeoJSON());
        if (features.length > 0) {
            const geojsons = JSON.stringify({
                'type': 'FeatureCollection',
                'features': features
            });
            console.log(geojsons);
            backend.save(geojsons, {
                okHandler: function(response) {
                            console.log('DataStore.saveToBackend() ', response);
                            },
                errorHandler:function(ex) {
                                console.log('DataStore.saveToBackend() error:', ex);
                            }
            });
        } else {
            console.log('Nothing to save');
        }
    }
}