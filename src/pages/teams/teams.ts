import { Component } from '@angular/core';
import { NavController, AlertController, NavParams, ActionSheetController } from 'ionic-angular';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs/Rx';
import { InfoPage } from '../info/info';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-teams',
  templateUrl: 'teams.html',
})
export class TeamsPage {
  teamsList: AngularFireList<any>;
  teams: Observable<any[]>;
  fb: AngularFireDatabase;
  datafield: string;
  val_search: string;
  vals: any[];
  display_teams: any[];
  storage: Storage;
  lastDatafield: string;
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    firebase: AngularFireDatabase,
    storage: Storage) {
    this.teamsList = firebase.list('/Teams');
    this.teams = this.teamsList.valueChanges();
    this.fb = firebase;
    this.storage = storage;
    this.datafieldChanged();
    this.val_search = "Null";
  }

  datafieldChanged() {
    var vals = ['Null'];
    var tempteams = [];
    this.teams.forEach(teamlist => {
      for (var team of teamlist) {
        if (!(vals.indexOf(team[this.datafield]) > 0) && team[this.datafield] != undefined) {
          vals.push(team[this.datafield]);
        }
        if (team[this.datafield] == undefined) {
          tempteams.push(team);
        }
      }
      //HACK, needs to be changed
      if (this.datafield === "No Filter" || this.datafield != this.lastDatafield) {
        this.val_search = "Null";
      }
      this.vals = vals.sort((n1,n2)=>(+n1)-(+n2));
      this.display_teams = tempteams;
    })
  }

  valueChanged() {
    // TODO: Add filter update function and put that in ionViewWillEnter
    var tempteams = [];
    if (this.val_search != "Null") {
      this.teams.forEach(teamlist => {
        for (var team of teamlist) {
          if (team[this.datafield] == this.val_search) {
            tempteams.push(team);
          }
        }
        this.display_teams = tempteams;
      })
    } else {
      this.teams.forEach(teamlist => {
        for (var team of teamlist) {
          if (team[this.datafield] == undefined) {
            tempteams.push(team);
          }
        }
        this.display_teams = tempteams;
      })
    }
  }

  //Stores teams when called in ionViewDidLoad
  storeTeam(team) {
    this.storage.set(""+team.teamNumber,team);
  }


  goToInfoPage(num,name) {
    this.lastDatafield = this.datafield;
    console.log("go to InfoPage with team number " + num);
    this.navCtrl.push(InfoPage,{
      firebase:this.fb,
      number:num,
      name:name,
      storage:this.storage,
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TeamsPage');
    this.teams.subscribe({
      next: list => {
        for (const team of list) {
          this.storeTeam(team);
        }
      },
      error: err => console.error('Observer got an error: ' + err),
      complete: () => console.log('Teams list retrieved'),
    })
  }

  ionViewWillEnter() {
    this.valueChanged();
  }

  addTeam(){
    let prompt = this.alertCtrl.create({
      title: 'New Team',
      message: "Enter the team number and name",
      inputs: [
        {
          name: 'title',
          placeholder: 'Enter Team Number',
        },
        {
          name: 'name',
          placeholder: 'Enter Team Name',
        }
      ],
      buttons: [
      {
        text: 'Cancel',
        handler: data => {
          console.log('Cancel clicked');
        }
      },
      {
        text: 'Save',
        handler: data => {
          const newTeamRef = this.fb.object('/Teams/'+data.title);
          newTeamRef.set({
            teamNumber: parseInt(data.title),
            name: data.name,
          })
          var tempteams = []
          this.teams.forEach(teamlist => {
            for (var team of teamlist) {
              tempteams.push(team);
            }
            this.display_teams = tempteams;
          })
        }
      }
    ]
  });
  prompt.present();
  }
}
