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
            previewPath: Group {
                orientation:'row',
                heading: StaticText { text: 'Preview:', alignment:['left','top'], preferredSize:[80,20] },
                e: EditText { text:'Null', alignment:['fill','top'], preferredSize:[-1,20], enabled:false }
            }
        },
        toolkit: Panel { 
            type:'tab', text:'Toolkit', alignment:['fill', 'top'], alignChildren:['fill','top'],  margins:[20,20,20,-1]
            heading: StaticText { text:'Expressions', alignment:['fill','top'] },
            expressionPick: DropDownList {},
            addExpressionBtn: Button { text: 'Add to Selected Property', preferredSize:[-1,20] },
            clrExpressionBtn: Button { text: 'Clear Selected Property', preferredSize:[-1,20] }
        },
        version: Panel { 
            type: 'tab', text:'Version', alignChildren:['fill','top'],  margins:[20,20,20,-1]
            heading: StaticText { text:'Team', alignment:['fill','top'] },
            teamPick: DropDownList {},
            switchTeamRnd: Button { text: 'Random Team', preferredSize:[-1,20] },
            heading: StaticText { text:'Show', alignment:['fill','top'] },
            showPick: DropDownList {},
            heading: StaticText { text:'Custom Text', alignment:['fill','top'] },                                
            cA: Group { orientation:'row', heading: StaticText { text:'A', preferredSize:[10,20] }, editTxtA: EditText { text: 'Custom Text A', alignment:['fill','center'] } }
            cB: Group { orientation:'row', heading: StaticText { text:'B', preferredSize:[10,20] }, editTxtB: EditText { text: 'Custom Text B', alignment:['fill','center'] } }
            cC: Group { orientation:'row', heading: StaticText { text:'C', preferredSize:[10,20] }, editTxtC: EditText { text: 'Custom Text C', alignment:['fill','center'] } }
            cD: Group { orientation:'row', heading: StaticText { text:'D', preferredSize:[10,20] }, editTxtD: EditText { text: 'Custom Text D', alignment:['fill','center'] } }
            switchBtn: Button { text: 'S W I T C H', preferredSize:[-1,20] },
            heading: StaticText { text:'', alignment:['fill','top'] },
            heading: StaticText { text:'Save Project / Include in Filename:', alignment:['fill','top'] },
            chkTeam: Checkbox { text: 'Team Tricode' },
            chkShow: Checkbox { text: 'Show Code' },
            chkTxtA: Checkbox { text: 'Custom Text A' },
            chkTxtB: Checkbox { text: 'Custom Text B' },
            chkTxtC: Checkbox { text: 'Custom Text C' },
            chkTxtD: Checkbox { text: 'Custom Text D' },
            saveWithTeam: Button { text: 'S A V E   . A E P', preferredSize:[-1,20] }
        },
        render: Panel { type:'tab', text:'Render', alignment:['fill', 'top'], alignChildren:['fill','top'],  margins:[20,20,20,-1]
            addToBatchRender: Button { text:'Add Project to .BAT', preferredSize:[-1,20] },
            statusBatchRender: Button { text: '?', preferredSize:[20,20] },
            clearBatchRender: Button { text: 'X', preferredSize:[20,20] },
            addToQueueBtn: Button { text:'Add RENDER_COMP to Queue', preferredSize:[-1,20] },
            addToQueueBtn: Button { text:'Add RENDER_COMP_WIP to Queue', preferredSize:[-1,20] },
            runBatchRender: Button { text:'Close AE & Run Batch', preferredSize:[-1,20] }
        }
    }
}