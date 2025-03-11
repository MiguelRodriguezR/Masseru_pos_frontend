import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-payment-chart',
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styleUrls: ['./payment-chart.component.scss']
})
export class PaymentChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @Input() chartData: any;
  @Input() chartOptions: any = {};

  private chart: Chart | undefined;

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the DOM is fully rendered
    setTimeout(() => {
      this.initializeChart();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && !changes['chartData'].firstChange && this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initializeChart(): void {
    if (!this.chartCanvas || !this.chartData) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // Default options for pie chart
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };
    
    // Merge default options with provided options
    const options = { ...defaultOptions, ...this.chartOptions };

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: this.chartData,
      options: options
    });
  }

  private updateChart(): void {
    if (!this.chart) {
      this.initializeChart();
      return;
    }

    this.chart.data = this.chartData;
    this.chart.update();
  }
}
