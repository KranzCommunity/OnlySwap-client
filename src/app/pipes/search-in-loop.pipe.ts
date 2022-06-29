import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchInLoop',
  pure: false
})
export class SearchInLoopPipe implements PipeTransform {

  transform(items: any[], filter: string) {
    if(!items || !filter) {
      return items;
    }
    filter = filter.toLowerCase();
    return items.filter(item => (item.symbol.toLowerCase().includes(filter) || item.name.toLowerCase().includes(filter) || item.address.toLowerCase().includes(filter)));
  }

}
