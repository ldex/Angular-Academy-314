import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, delay, shareReplay, tap, retry } from 'rxjs/operators';
import { Product } from './product.interface';
import { LoadingService } from '../services/loading.service';
import { delayedRetry } from '../delayedRetry.operator';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl = 'https://storerestservice.azurewebsites.net/api/products/';
  products$: Observable<Product[]>;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService) {
    this.initProducts();
  }

  initProducts() {
    let url:string = this.baseUrl + `?$orderby=ModifiedDate%20desc`;

    this.products$ = this
                      .http
                      .get<Product[]>(url)
                      .pipe(
                        delay(1500), // pour démo!
                        shareReplay(),
                        //retry(3),
                        delayedRetry(500, 3),
                        catchError(error => {
                          console.log(error);
                          return throwError(error);
                        }
                        )
                      );

    this.loadingService.showLoaderUntilCompleted(this.products$);
  }

  insertProduct(newProduct: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, newProduct).pipe(delay(2000));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(this.baseUrl + id);
  }
}
