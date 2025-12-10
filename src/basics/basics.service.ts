import { Controller, Injectable } from '@nestjs/common';

@Injectable()
export class BasicsService {

    getMyFirstGet(): object {
        return {
            service: 'Blog-Backend',
            controller: '/basics',
            function: 'Get Example'
        };
    }

    getConParametros(parametro: string): object {
        return {
            service: 'Blog-Backend',
            controller: '/basics',
            function: 'Get con Parametros',
            parametroRecibido: parametro
        };
    }

    postFunction(bodyPost: object): object {
        return {
            service: 'Blog-Backend',
            controller: '/basics tipo post',
            function: 'Ejemplo de Peticion Post',
            body: bodyPost
        };            
    }

    putFunction(bodyPost: object, parametro: string): object {
        return {
            service: 'Blog-Backend',
            controller: '/basics tipo put',
            function: 'Ejemplo de Peticion Put',
            body: bodyPost,
            parametro: parametro
        };            
    }

    deleteFunction(parametro: string): object {
        return {
            service: 'Blog-Backend',
            controller: '/basics tipo delete',
            function: 'Ejemplo de Peticion Delete',
            parametro: parametro
        };            
    }

      calculoTriangulo(body: any): object {
        const result: number = (body.base * body.altura) / 2;
        return {
        service: 'Blog-Backend',
        controller: '/basics tipo delete',
        function: 'Ejemplo de peticion Delete',
        parametro: body,
        resultado: result,
        };
    }
    areaRectangulo(ancho: number, alto: number): object {
        const result: number = ancho * alto;
        return {
        service: 'Blog-Backend',
        controller: '/basics tipo delete',
        function: 'calculo-area-rectangulo/:ancho/:alto',
        ancho: ancho,
        alto: alto,
        resultado: result,
        };
    }
}
