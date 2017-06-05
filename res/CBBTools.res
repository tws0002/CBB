group { 
    orientation:'column', alignment:['fill','fill'], alignChildren:['fill','top'],
    tabs: Panel { 
        text:'', type:'tabbedpanel', alignment:['center', 'top'], orientation:'column', alignChildren:['fill','top'],
        setup: Panel { 
            type:'tab', text:'Setup', alignment:['fill', 'top'], alignChildren:['fill','top'], margins:[20,20,20,-1] 
            projectName: Group {
                orientation:'stacked', alignChildren:['fill','top'],
                pick: Group { 
                    orientation:'row',
                    heading: StaticText { text: 'Project folder:', alignment:['left','top'], preferredSize:[80,20] },
                    dd: DropDownList { alignment:['fill','top'], preferredSize:[-1,20] }
                },
                edit: Group { 
                    orientation:'row',
                    heading: StaticText { text: 'New folder:', alignment:['left','top'], preferredSize:[80,20] },
                    e: EditText { alignment:['fill','top'], preferredSize:[-1,20] }
                },
            }
            useExisting: Group {
                orientation:'row',
                heading: StaticText { text: '', alignment:['left','top'], preferredSize:[80, 20] },
                cb: Checkbox { text: 'Use existing project folder' },                            
            },
            sceneName: Group {
                orientation:'row',
                heading: StaticText { text: 'Scene name:', alignment:['left','top'], preferredSize:[80,20] },
                e: EditText { alignment:['fill','top'], preferredSize:[-1,20] }
            },
            createProject: Button { text: 'Create / Rename Project', alignment:['fill','top'] },
        },
        version: Panel { 
            type: 'tab', text:'Version', alignChildren:['fill','top'],  margins:[20,20,20,-1],
            team: Group {
                orientation: 'row',
                cb: Checkbox {},
                heading: StaticText { text:'Team:', alignment:['left','top'], size:[40, 20] },
                dd: DropDownList { alignment:['fill','top'], size:[-1, 20] },
            },
            prod: Group {
                orientation: 'row',
                cb: Checkbox {},
                heading: StaticText { text:'Show:', alignment:['left','top'], size:[40, 20] },
                dd: DropDownList { alignment:['fill','top'], size:[-1, 20] },
            },
            customA: Group {
                orientation: 'row',
                cb: Checkbox {},
                et: EditText { text: 'Custom Text A', alignment:['fill', 'center'] },
            },
            customB: Group {
                orientation: 'row',
                cb: Checkbox {},
                et: EditText { text: 'Custom Text B', alignment:['fill', 'center'] },
            },
            customC: Group {
                orientation: 'row',
                cb: Checkbox {},
                et: EditText { text: 'Custom Text C', alignment:['fill', 'center'] },
            },
            customD: Group {
                orientation: 'row',
                cb: Checkbox {},
                et: EditText { text: 'Custom Text D', alignment:['fill', 'center'] },
            },
            save: Button { text: 'Save Project', preferredSize:[-1,20] },
            bat: Group {
                orientation:'row', alignChildren:['fill','top'],
                addToBat: Button { text:'Add Project to .BAT', alignment:['fill','top'], preferredSize:[-1,20] },
                checkBat: Button { text: '?', size:[20,20] },
                clearBat: Button { text: 'X', size:[20,20] },
                runBat: Button { text: 'Run', size:[20,20] },
            }
        },
        toolkit: Panel { 
            type:'tab', text:'Toolkit', alignment:['fill', 'top'], alignChildren:['fill','top'],  margins:[20,20,20,-1],
            heading: StaticText { text:'Expressions', alignment:['fill','top'] },
            expPick: DropDownList {},
            expAdd: Button { text: 'Add to Selected Property', preferredSize:[-1,20] },
            expClear: Button { text: 'Clear Selected Property', preferredSize:[-1,20] }
        },
    },
}