import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-listbox',
  templateUrl: './listbox.component.html',
  styleUrls: ['./listbox.component.css']
})
export class ListboxComponent implements OnInit {
  @Input() item: any;
  @Input() selected!: boolean;

  constructor() { }

  ngOnInit() {
  }
}
