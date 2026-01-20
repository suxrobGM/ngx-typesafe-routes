import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TypesafeRoutes } from "./typesafe-routes";

describe("TypesafeRoutes", () => {
  let component: TypesafeRoutes;
  let fixture: ComponentFixture<TypesafeRoutes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypesafeRoutes],
    }).compileComponents();

    fixture = TestBed.createComponent(TypesafeRoutes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
