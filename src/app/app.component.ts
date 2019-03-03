import { Component, ElementRef, ViewChild, ComponentFactoryResolver, Renderer2} from '@angular/core';
import avengersJson from './avengers.json';
import countriesJson from './countries.json';
import chores from './chores.json'
import { Country, countries, continents } from 'countries-list'
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import { validateStyleParams } from '@angular/animations/browser/src/util';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import {MatIconRegistry} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';
function nameSort (a, b) {
      let val: number =0;
      if (a.name < b.name) {
        val = -1;
      } else if (a.name > b.name) {
        val = 1;
      } else {
        val = 0;
      }
      return val;
}


export class Avenger {
  id: number;
  name: string;
  categories: Category[];
}

export class Category {
   id: number;
   name: string;
   tasks: Task[] = [];
   isExpanded: false;
}

export class Task {
   id: number;
   name: string;
   selected: boolean;
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('ngIfTrigger', [
        transition(':enter', [
          style({ opacity: 0 }),
          animate('150ms', style({ opacity: 1 })),
        ]),
        transition(':leave', [
          animate('150ms', style({ opacity: 0 }))
        ])
    ])
   ]
})
export class AppComponent {
  title = 'The Avengers\' Chore Board';
  avengers: Avenger[];
  continentArray = Array.from(Object.keys(continents));
  isDirty: boolean = false;
  @ViewChild('dragImage') dragImage: ElementRef;

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon(
        'lock',
        sanitizer.bypassSecurityTrustResourceUrl('assets/baseline-lock-24px.svg'));
    iconRegistry.addSvgIcon(
        'lock_open',
        sanitizer.bypassSecurityTrustResourceUrl('assets/baseline-lock_open-24px.svg'));

    const localAvengers = localStorage.getItem("avengers");
    console.log('from local storage', localAvengers);
    if (localAvengers) {
        this.avengers = JSON.parse(localAvengers) as Avenger[];
    console.log('from local storage', this.avengers);
    } else {
        this.avengers = avengersJson as Avenger[];
        this.avengers.forEach((avenger) => this.initializeCategories(avenger));
        this.initializeTasks(this.avengers[0]);
    }

  }

  initializeCategories(avenger) {
    avenger.categories = [];

    chores.forEach((chore, i) => {
        const category = new Category();
        category.id = i;
        category.name = chore.category;
        category.tasks = [];
        avenger.categories.push(category);
    });
  }

  initializeTasks(avenger) {
    avenger.categories.forEach((category, i) => {
        category.tasks = [];
        const choreCategory = chores.find((chore) => chore.category === category.name);
        console.log('choreCat', choreCategory);
        choreCategory.tasks.forEach((tsk) => {
            console.log('choreCat Task', tsk);
            const task = new Task();
            task.id = category.tasks.length;
            task.name = tsk.name;
            category.tasks.push(task);
        });
    });
    avenger.categories.forEach((ct) => ct.tasks.sort(nameSort));

  }

  initializeCategoriesOld(avenger) {
    avenger.categories = [];
    Object.keys(continents).forEach((cd, i) => {
        const category = new Category();
        category.id = i;
        category.name = continents[cd];
        category.tasks = [];
        avenger.categories.push(category);
    });
  }

  initializeTasksOld(avenger) {
    Object.values(countries).forEach((country) => {
      const task = new Task();
      task.name = country.name;
      const continentName = continents[country.continent];
      const category = avenger.categories.find(ct => ct.name === continentName);
      task.id = category.tasks.length;
      task.selected = false;
      category.tasks.push(task);
    });
    avenger.categories.forEach((ct) => ct.tasks.sort(nameSort));

  }


  toggle(ev, aid, category) {
      if (aid === 0) {
        category.isExpanded = !category.isExpanded;
        this.avengers.forEach((avenger) => {
            avenger.categories[category.id].isExpanded = category.isExpanded;
        });
      }

  }

  allowDrop(ev) {
    ev.preventDefault();
  }

  dragCategory(ev,category) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('draggableId', ev.currentTarget.id);
      ev.dataTransfer.setData('draggableAvengerId', ev.currentTarget.dataset.aid);
      ev.dataTransfer.setData('draggableCategoryName', ev.currentTarget.dataset.categoryname);
  }

  dragTask(ev, category, task) {

      task.selected = true;
      if (category.tasks.filter(task =>task.selected).length > 1) {
          ev.dataTransfer.setDragImage(this.dragImage.nativeElement, 20, 20);
      }
      console.log('dragging cont', ev.dataTransfer);
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('draggableId', ev.currentTarget.id);
      ev.dataTransfer.setData('draggableAvengerId', ev.currentTarget.dataset.aid);
      ev.dataTransfer.setData('draggableCategoryName', ev.currentTarget.dataset.continentname);
      ev.dataTransfer.setData('draggableTaskId', ev.currentTarget.dataset.taskid);
  }

  drop(ev) {
      ev.preventDefault();
      if(!ev.dataTransfer.getData("draggableCategoryName")) {
        return;
      }
      const categoryName: string = ev.dataTransfer.getData("draggableCategoryName");
      const taskId: number = ev.dataTransfer.getData("draggableTaskId");
      const sourceAvengerId = ev.dataTransfer.getData("draggableAvengerId");
      const targetAvengerId = ev.currentTarget.dataset.aid;
      if(sourceAvengerId == targetAvengerId) {
          return;
      }
      const sourceAvenger = this.avengers[sourceAvengerId];
      const targetAvenger = this.avengers[targetAvengerId];

      const sourceCategory = sourceAvenger.categories.find(ct => ct.name === categoryName);
      const targetCategory = targetAvenger.categories.find(ct => ct.name === categoryName);

      let tasksSelected = sourceCategory.tasks.filter(task =>task.selected).length;

      console.log('tasks selected', tasksSelected);
      if (taskId && tasksSelected === 0) {
          console.log('moving 1', taskId);
          this.transferTask(sourceCategory, targetCategory, taskId);
          sourceCategory.tasks.splice(taskId,1);
      } else if (tasksSelected > 0) {

        const toBeDeleted = [];
         sourceCategory.tasks
            .forEach((task, i) => {
               if (sourceCategory.tasks[i]['selected']) {
                  this.transferTask(sourceCategory, targetCategory, i);
                  toBeDeleted.push(i);
               }
            });

            toBeDeleted.sort().reverse();
            console.log(toBeDeleted);
            toBeDeleted.forEach((i) => {
                sourceCategory.tasks.splice(i,1);
            });
          // sourceCategory.tasks = sourceCategory.tasks.filter(task => !task['selected']);

      } else {
         this.transferAllTasks(sourceCategory, targetCategory)
      }
      targetCategory.tasks.sort(nameSort);
      this.isDirty = true;

  }

  transferAllTasks(sourceCategory, targetCategory) {
        sourceCategory.tasks.forEach((task) => {
            targetCategory.tasks.push(task);
            task.selected = false;
         });
        targetCategory.tasks.sort(nameSort);
        sourceCategory.tasks = [];
  }
  transferTask(sourceCategory, targetCategory, taskId) {
        const task = sourceCategory.tasks[taskId];
        targetCategory.tasks.push(sourceCategory.tasks[taskId]);
        task.selected = false;
  }

  onMouseUpOverTask(ev, category, task) {
    ev.stopPropagation();
    task.selected = !task.selected
  }

  getTaskCount(avenger) {
   return avenger.categories.reduce((count,category)  => count+category.tasks.length, 0);
  }

  lock() {
    localStorage.setItem("avengers", JSON.stringify(this.avengers));
    console.log('storing', JSON.stringify(this.avengers));
    console.log('stored', JSON.parse(localStorage.getItem("avengers")));
     this.isDirty = false;
  }
}
