import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, EMPTY, combineLatest, Subscription } from 'rxjs';
import { tap, catchError, startWith, count, flatMap, map, debounceTime, filter, distinctUntilChanged } from 'rxjs/operators';

import { Product } from '../product.interface';
import { ProductService } from '../product.service';
import { FavouriteService } from '../favourite.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  title: string = 'Products';
  selectedProduct: Product;

  products$: Observable<Product[]>;
  productsNumber$: Observable<number>;
  filter$: Observable<string>;
  filteredProducts$: Observable<Product[]>;
  filtered$: Observable<boolean>;

  favouriteAdded$: Observable<Product>;

  filter:FormControl = new FormControl("");
  errorMessage;

  // Pagination
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;

  firtPage() {
    this.start = 0;
    this.end = this.pageSize;
    this.currentPage = 1;
  }

  previousPage() {
    this.start -= this.pageSize;
    this.end -= this.pageSize;
    this.currentPage--;
    this.selectedProduct = null;
  }

  nextPage() {
    this.start += this.pageSize;
    this.end += this.pageSize;
    this.currentPage++;
    this.selectedProduct = null;
  }

  onSelect(product: Product) {
    this.selectedProduct = product;
    this.router.navigateByUrl('/products/' + product.id);
  }

  get favourites(): number {
    return this.favouriteService.getFavouritesNb();
  }

  constructor(
    private productService: ProductService,
    private favouriteService: FavouriteService,
    private router: Router) {
  }

  ngOnInit(): void {

    this.favouriteAdded$ = this
                            .favouriteService
                            .favouriteAdded$
                            .pipe(
                              tap(product => console.count('produit [' + product?.id + '] ajouté aux favoris.'))
                            );

        // .subscribe(
        //   product => {
        //     console.count('produit ajouté aux favoris: ' + product.name);
        //     this.favouriteAdded = product;
        //   }
        // )


    // Self url navigation will refresh the page ('Refresh List' button)
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.products$ = this
                      .productService
                      .products$;

    this.filter$ = this.filter
                    .valueChanges
                    .pipe(
                      debounceTime(500),
                      map(text => text.trim()),
                      filter<string>(text => text.length > 3 || text == ""),
                      distinctUntilChanged(),
                      tap(text => {
                        console.warn(text);
                        this.firtPage();
                      }),
                      startWith("")
                    );

    this.filtered$ = this
                        .filter$
                        .pipe(
                          map(text => text.length > 0)
                        )

    this.filteredProducts$ = combineLatest([this.products$, this.filter$])
        .pipe(
          map(([products, filterString]) =>
            products.filter(product =>
              product.name.toLowerCase().includes(filterString.toLowerCase())
            )
          )
        )

    this.productsNumber$ = this
        .filteredProducts$
        .pipe(
          map(products => products.length),
          startWith(0)
        );
  }

  refresh() {
    this.productService.initProducts();
    this.router.navigateByUrl('/products'); // Self route navigation
  }
}
