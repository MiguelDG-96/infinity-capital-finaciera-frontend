import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReporteDTO {
  prestamosAprobados: number[];
  prestamosRechazados: number[];
  estadoCartera: number[];
  clientesActivos: number[];
  desembolsos: number[];
  recuperacion: number[];
  tiposCredito: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  getDashboardData(year: string, mes: string, sucursal: string): Observable<ReporteDTO> {
    let params = new HttpParams()
      .set('year', year)
      .set('mes', mes)
      .set('sucursal', sucursal);
      
    return this.http.get<ReporteDTO>(`${this.apiUrl}/dashboard`, { params });
  }

  exportarPdf(year: string, mes: string, sucursal: string): void {
    let params = new HttpParams()
      .set('year', year)
      .set('mes', mes)
      .set('sucursal', sucursal);

    this.http.get(`${this.apiUrl}/exportar-pdf`, { params, responseType: 'blob' }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Financiero_${year}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
