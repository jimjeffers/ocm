import React, {Component} from 'react';
import {observer} from 'mobx-react';
import {FormGroup, ControlLabel, FormControl, HelpBlock, Button, ButtonToolbar} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import MobxReactForm from 'mobx-react-form';
import validatorjs from 'validatorjs';

import {store} from './DataStore';


const plugins = { dvr: validatorjs };

const fields = ['id', 'name', 'grade', 'gradeType'];

const gradeOptions = [
        {
            name: '-- Select a type --',
            key: 'undefined'

        },
        {
            name: 'Yosemite Decimal System',
            key:'yds'
        },
        {
            name: 'French', 
            key:'french'}
        ];

const rules = {
  name: 'required|string|between:2,50',
  grade: ['required','regex:/^5\\.(([0-9]|1[0-5])[\\+\\-]?|1[0-6][abcd])$/']
};


class FormHandler extends MobxReactForm {

  onSuccess(form) {
    console.log('Form Values!', form.values());
    store.updateFeatureProps(form.values().id, toGeoJsonProps(form.values()))
  }

  onError(form) {
    // get all form errors
    console.log('All form errors', form.errors());
    // invalidate the form with a custom error message
    form.invalidate('This is a generic error message!');
  }
}


const FormWidget = observer(({ form, closeFn }) => (
    <form>
        <FormGroup controlId={form.$('name').id}  validationState={form.$('name').isValid ? 'success' : 'error'}>
            <ControlLabel>{form.$('name').label}</ControlLabel>
            <FormControl {...form.$('name').bind()} />
            <FormControl.Feedback />
            <HelpBlock>{form.$('name').error}</HelpBlock>
        </FormGroup>    

        <FormGroup controlId={form.$('grade').id}  validationState={form.$('grade').isValid ? 'success' : 'error'}>
            <ControlLabel>{form.$('grade').label}</ControlLabel>
            <FormControl {...form.$('grade').bind()} />
            <FormControl.Feedback />
            <HelpBlock>{form.$('grade').error}</HelpBlock>
        </FormGroup>

        <FormGroup controlId={form.$('gradeType').id}>
            <ControlLabel>{form.$('gradeType').label}</ControlLabel>
            <FormControl  {...form.$('gradeType').bind()} componentClass="select">
                {gradeOptions.map(opt => 
                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                    )
                }>
            </FormControl>
        </FormGroup>
        
        <ButtonToolbar>
            <Button 
                bsStyle="success"
                type="submit" 
                disabled={ form.isValid ? false : true } 
                onClick={form.onSubmit}><FontAwesome name='floppy-o'/>&nbsp;Save Changes</Button>
           
            <Button 
                type="reset" 
                onClick={form.onClear}><FontAwesome name='undo'/>&nbsp;Clear Form</Button>

            <Button 
                type="button" 
                onClick={closeFn}><FontAwesome name='times'/>&nbsp;Close Without Saving</Button>
        </ButtonToolbar>

    </form>
));


export default class RouteForm extends Component {
    render() {
        const values = loadGeoJsonPropsFromStore(this.props.targetId);
        const formHandler = new FormHandler({ fields, rules, values }, { plugins });
        return (
            <FormWidget form={ formHandler } closeFn={this.props.closeFn}/>
        );
    }
}


function toGeoJsonProps(values) {
    const props = {
        name: values.name,
        grade: {
            value: values.grade,
            type: values.gradeType
        }
    };
    return props;
} 


function loadGeoJsonPropsFromStore(id) {
    const editableFeature = store.getFeature(id);
    console.log("loading id->editableFeature ", id, editableFeature);
    if (editableFeature !== null) {
        const props = editableFeature.props;
        if (props !== null) {
            return {
                id: id,
                name: props.name,
                grade: props.grade.value,
                gradeType: props.grade.type
            }
        }
    } 
    return {
        id: id,
        name: "",
        grade: "",
        gradeType: ""
    }
}