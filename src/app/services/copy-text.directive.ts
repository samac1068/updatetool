import {Directive, HostListener, Input} from '@angular/core';
import {ConlogService} from '../modules/conlog/conlog.service';

@Directive({
  selector: '[text-copy]'
})
export class CopyTextDirective {

  @Input('text-copy') text!:string;

  constructor(private conlog: ConlogService) { }

  // The HostListener will listen to click events and run the below function, the HostListener supports other standard events such as mouseenter, mouseleave etc.
  @HostListener('click') copyText() {
  //console.log('inside the text copy directive');
    // We need to create a dummy textarea with the text to be copied in the DOM
    let textArea = document.createElement("textarea");

    // Hide the textarea from actually showing
    textArea.style.position = 'fixed';
    textArea.style.top = '-999px';
    textArea.style.left = '-999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    // Set the texarea's content to our value defined in our [text-copy] attribute
    textArea.value = this.text;
    document.body.appendChild(textArea);

    // This will select the textarea
    textArea.select();

    try {
      // Most modern browsers support execCommand('copy'|'cut'|'paste'), if it doesn't it should throw an error
      let successful = document.execCommand('copy');
      let msg = successful ? 'successful' : 'unsuccessful';
      // Let the user know the text has been copied, e.g toast, alert etc.
      //console.log(msg);
    } catch (err) {
      // Tell the user copying is not supported and give alternative, e.g alert window with the text to copy
      this.conlog.log('unable to copy');
    }

    // Finally we remove the textarea from the DOM
    document.body.removeChild(textArea);
  }
}
