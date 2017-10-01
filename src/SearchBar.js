import React, { Component } from 'react';
import {Navbar, FormGroup, Button, Popover, OverlayTrigger, Row, Col} from 'react-bootstrap';
import Geocoder from 'react-geocoder-autocomplete';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';


export default class SearchBar extends Component {

    constructor(props) {
        super(props);
        this.overlay = null
        this.state = {
            geocode: null,
            radius: 50000, // in km
        }
    }


    onSelect = (geocode) => {
        this.setState({geocode: geocode});
        this.props.updateMapCenter({geocode: geocode, radius: this.state.radius});
    }

    onSuggest = (results) => {
        console.log("Geocoder results", results);
    }


    onUpdateRadius = (radius) => {
        this.setState({radius: radius});
        if (this.state.geocode !== null) {
            this.props.updateMapCenter({geocode: this.state.geocode, radius: radius});
        }       
    }


    render() {
        return (<Navbar.Form pullLeft>
                    <FormGroup>
                        <Geocoder
                            accessToken='pk.eyJ1IjoidmlldGdvZXN3ZXN0IiwiYSI6ImNpbzljZnVwNTAzM2x2d2x6OTRpb3JjMmQifQ.rcxOnDEeY4McXKDamMLOlA'
                            onSelect={this.onSelect}
                            onSuggest={this.onSuggest}
                            defaultInputValue={this.props.initialSearch}
                            showLoader={false}
                            focusOnMount={true}
                            resultsClass='searchBar-results'
                            resultFocusClass='searchBar-resultFocusClass'
                            />
                        <SearchRadius initialRadius={this.state.radius} onUpdateRadius={this.onUpdateRadius} />
                    </FormGroup>
                </Navbar.Form>);

    }
}


class SearchRadius extends Component { 

    constructor(props) {
        super(props);
        this.state = {
            previousRadius: this.props.initialRadius,
            appliedRadius: this.props.initialRadius,
            currentRadius: this.props.initialRadius,
        };
    }

    onSliderChange = (radius) => {
        this.setState({
            currentRadius: radius,
        });
    }

    onAfterChange = (radius) => {
        this.setState({
            appliedRadius: radius,
        });
    }
 

    onApplyRadiusChange = () => {
        this.setState({open: false});
        this.overlay.hide();
        this.props.onUpdateRadius(this.state.appliedRadius);
    }


    onCancelRadiusChange = () => {
        this.overlay.hide();
        this.setState({
            appliedRadius: this.state.previousRadius,
            currentRadius: this.state.previousRadius 
        });
    }


    render() {
        return (
            <div className="search-radius-component">
                <OverlayTrigger ref={el => this.overlay = el} trigger="click" placement="bottom" overlay={this.searchRadiusPopover()}>
                    <Button bsStyle="link">
                        Within {Math.round(this.state.appliedRadius/1000)} km
                    </Button>
                </OverlayTrigger>
             </div>
        );
    }

  
    searchRadiusPopover = () => (
            <Popover id="search-radius-popover">
                <Row className="show-grid">
                        <Col md={12}>
                            <div className="search-radius-popover-value">{Math.round(this.state.currentRadius/1000)} km</div>       
                            <Slider min={1000} max={150000} 
                                    defaultValue={30000}
                                    value={this.state.currentRadius} 
                                    onChange={this.onSliderChange}
                                    onAfterChange={this.onAfterChange} 
                                    handleStyle={{
                                        borderRadius: '30%',
                                        border: 'solid 4px orange',
                                        height: 30,
                                        width: 25,
                                        marginTop:-13,
                                        marginLeft:-15,
                                        backgroundColor: 'white',
                                        boxShadow: '3px 3px 5px LightGray'
                                        }}
                                />
                        </Col>
                    </Row>
                    <Row className="show-grid">
                        <Col md={4}>
                            <Button bsStyle="link" onClick={this.onCancelRadiusChange}>Cancel</Button>
                        </Col>
                        <Col md={4} mdOffset={4}>
                            <Button bsStyle="link" onClick={this.onApplyRadiusChange}>Apply</Button>
                        </Col>
                    </Row>
             </Popover>
            );
}