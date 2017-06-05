group { 
    orientation:'column', alignment:['fill','fill'], alignChildren:['fill','top'], size:[-1,-1],
    tabs: Panel { text:'', type:'tabbedpanel', alignment:['fill','top'], orientation:'column', alignChildren:['fill','top'], size:[-1,-1],
        setup: Panel { type:'tab', text:'Setup', alignment:['fill', 'top'], alignChildren:['fill','top'], margins:[15,10,0,-1], size:[-1,-1],
            projectName: Group {
                orientation:'stacked', alignChildren:['fill','top'],
                pick: Group { 
                    orientation:'row',
                    heading: StaticText { text: 'Project folder:', alignment:['left','top'], preferredSize:[75,20] },
                    dd: DropDownList { alignment:['fill','top'], preferredSize:[-1,20] }
                },
                edit: Group { 
                    orientation:'row',
                    heading: StaticText { text: 'New folder:', alignment:['left','top'], preferredSize:[75,20] },
                    e: EditText { alignment:['fill','top'], preferredSize:[-1,20] }
                },
            }
            useExisting: Group {
                orientation:'row',
                heading: StaticText { text: '', alignment:['left','top'], preferredSize:[75,20] },
                cb: Checkbox { text: 'Use existing project folder' },                            
            },
            sceneName: Group {
                orientation:'row',
                heading: StaticText { text: 'Scene name:', alignment:['left','top'], preferredSize:[75,20] },
                e: EditText { alignment:['fill','top'], preferredSize:[-1,20] }
            },
            createProject: Button { text: 'Create / Rename Project', alignment:['fill','top'] },
            separator: Panel { type:'panel', alignment:['fill','top'], preferredSize:[-1,0] },
            createTemplate: Button { text: 'Build Template', alignment:['fill','top'] },
            updateUI: Button { text: 'Refresh UI', alignment:['fill','top'] }
        },
        version: Panel { type: 'tab', text:'Version', alignChildren:['fill','top'],  margins:[15,10,0,-1],
            div: Group {
                orientation: 'row',
                fields: Group {
                    orientation: 'column', preferredSize:[-1,-1], alignment:['fill','top'], alignChildren:['fill','top'],
                    team: Group {
                        orientation: 'row',
                        heading: StaticText { text:'Team:', alignment:['left','top'], preferredSize:[40, 20] },
                        dd: DropDownList { alignment:['fill','top'], preferredSize:[-1, 20] }
                    },
                    prod: Group {
                        orientation: 'row',
                        heading: StaticText { text:'Show:', alignment:['left','top'], preferredSize:[40, 20] },
                        dd: DropDownList { alignment:['fill','top'], preferredSize:[-1, 20] }
                    },
                    etA: EditText { text: 'Custom Text A', alignment:['fill', 'center'] },
                    etB: EditText { text: 'Custom Text B', alignment:['fill', 'center'] },
                    etC: EditText { text: 'Custom Text C', alignment:['fill', 'center'] },
                    etD: EditText { text: 'Custom Text D', alignment:['fill', 'center'] },
                },
                checks: Group {
                    orientation: 'column', preferredSize:[15,-1], alignment:['right','center'],
                    cbT: Checkbox { alignment:['right','center'], size:[15,23] },
                    cbS: Checkbox { alignment:['right','center'], size:[15,23] },
                    cbA: Checkbox { alignment:['right','center'], size:[15,23] },
                    cbB: Checkbox { alignment:['right','center'], size:[15,23] },
                    cbC: Checkbox { alignment:['right','center'], size:[15,23] },
                    cbD: Checkbox { alignment:['right','center'], size:[15,23] }
                }
            },
            update: Button { text: 'Update Text', preferredSize:[-1,20] },
            separator: Panel { alignment:['fill','center'], preferredSize:[-1,0] },
            save: Button { text: 'Save Project', preferredSize:[-1,20] },
            bat: Group {
                orientation:'row', alignChildren:['fill','top'],
                addToBat: Button { text:'Add Project to .BAT', alignment:['fill','top'], preferredSize:[-1,20] },
                checkBat: Button { text: '?', size:[20,20] },
                clearBat: Button { text: 'X', size:[20,20] },
                runBat: Button { text: 'Run', size:[20,20] },
            }
        },
        toolkit: Panel { type:'tab', text:'Toolkit', alignment:['fill', 'top'], alignChildren:['fill','top'],  margins:[15,10,0,-1],
            heading: StaticText { text:'Expressions', alignment:['fill','top'] },
            expPick: DropDownList {},
            expAdd: Button { text: 'Add to Selected Property', preferredSize:[-1,20] },
            expClr: Button { text: 'Clear Selected Property', preferredSize:[-1,20] }
        }
    }
}